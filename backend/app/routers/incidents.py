import json
import os
import subprocess
import time
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.dependencies import get_dependencies, get_dependents
from backend.app.logging_config import logger
from backend.app.memory_model import IncidentMemory
from backend.app.models import ActiveIncident, RemediationAudit, Service
from backend.app.safety import evaluate_remediation_safety

from agents.log_agent import analyze_logs
from agents.rca_agent import analyze_root_cause

router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents & Remediation"],
)

PROJECT_ROOT = settings.COMPOSE_DIR
DOCKER_TIMEOUT = settings.DOCKER_TIMEOUT


def docker_compose_command(*args):
    """Build a Docker Compose command using Sentinel AI's root docker-compose.yml."""
    compose_file = os.path.join(settings.COMPOSE_DIR, "docker-compose.yml")
    return ["docker", "compose", "-f", compose_file, *args]


def run_docker_command(args):
    """Execute Docker commands safely."""
    try:
        result = subprocess.run(
            args,
            cwd=settings.COMPOSE_DIR,
            capture_output=True,
            text=True,
            timeout=DOCKER_TIMEOUT,
            shell=False,
        )
        return {
            "success": result.returncode == 0,
            "return_code": result.returncode,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
        }
    except subprocess.TimeoutExpired:
        logger.warning(f"Docker command timed out: {args}")
        return {
            "success": False,
            "return_code": -1,
            "stdout": "",
            "stderr": "Docker command timed out.",
        }
    except Exception as exc:
        logger.error(f"Docker execution error: {exc}")
        return {
            "success": False,
            "return_code": -1,
            "stdout": "",
            "stderr": str(exc),
        }


def get_docker_service_status(service_name: str):
    """Inspect the live Docker container state for a microservice."""
    command = docker_compose_command("ps", "--format", "json", service_name)
    result = run_docker_command(command)

    if not result["success"]:
        return {
            "service": service_name,
            "status": "docker_unavailable",
            "running": False,
            "docker_available": False,
            "error": result["stderr"],
        }

    output = result["stdout"]
    if not output:
        return {
            "service": service_name,
            "status": "stopped",
            "running": False,
            "docker_available": True,
        }

    try:
        first_line = output.splitlines()[0]
        data = json.loads(first_line)
        raw_status = data.get("State") or data.get("Status") or "unknown"
        status_lower = str(raw_status).lower()
        running = "running" in status_lower or status_lower.startswith("up")

        return {
            "service": service_name,
            "status": raw_status,
            "running": running,
            "docker_available": True,
            "container": data.get("Name"),
            "image": data.get("Image"),
        }
    except Exception:
        status_lower = output.lower()
        running = "running" in status_lower or "up " in status_lower
        return {
            "service": service_name,
            "status": output,
            "running": running,
            "docker_available": True,
        }


def stop_docker_service(service_name: str):
    return run_docker_command(docker_compose_command("stop", service_name))


def restart_docker_service(service_name: str):
    return run_docker_command(docker_compose_command("restart", service_name))


def recreate_docker_service(service_name: str):
    return run_docker_command(
        docker_compose_command("up", "-d", "--force-recreate", service_name)
    )


def scale_docker_service(service_name: str):
    return run_docker_command(
        docker_compose_command(
            "up", "-d", "--scale", f"{service_name}=2", "--no-recreate", service_name
        )
    )


INCIDENT_CONFIG = {
    "db_down": {
        "service": "order-service",
        "title": "Database dependency failure",
        "description": "Order service cannot access the database.",
    },
    "payment_failure": {
        "service": "payment-service",
        "title": "Payment service failure",
        "description": "Payment processing requests are failing.",
    },
    "order_crash": {
        "service": "order-service",
        "title": "Order service crash",
        "description": "Order service became unavailable.",
    },
    "api_failure": {
        "service": "product-service",
        "title": "Product API failure",
        "description": "Product API is returning unhealthy responses.",
    },
    "cpu_spike": {
        "service": "order-service",
        "title": "CPU spike",
        "description": "Order service CPU utilization is abnormally high.",
    },
    "memory_leak": {
        "service": "inventory-service",
        "title": "Memory leak",
        "description": "Inventory service memory consumption is increasing.",
    },
}


class AutonomousRemediationRequest(BaseModel):
    action: str
    service: str
    incident_type: Optional[str] = None
    approved: bool = False
    force_override: bool = False


class RecoveryRequest(BaseModel):
    action: Optional[str] = "restart_service"


def generate_incident_logs(incident_type: str, service_name: str):
    timestamp = datetime.now(timezone.utc).isoformat()
    templates = {
        "db_down": f"""{timestamp} ERROR {service_name}\nDatabase connection failed.\nConnection refused.\nDatabase dependency unavailable.\nRequest processing aborted.""",
        "payment_failure": f"""{timestamp} ERROR {service_name}\nPayment gateway request failed.\nPayment transaction timeout.\nUpstream payment dependency unavailable.\nTransaction rejected.""",
        "order_crash": f"""{timestamp} ERROR {service_name}\nOrder service process became unavailable.\nHTTP connection refused.\nHealth check failed.\nContainer stopped unexpectedly.""",
        "api_failure": f"""{timestamp} ERROR {service_name}\nProduct API returned HTTP 500.\nUpstream request failed.\nAPI health check failed.\nService response latency increased.""",
        "cpu_spike": f"""{timestamp} WARN {service_name}\nCPU utilization exceeded 95 percent.\nRequest processing latency increased.\nWorker queue growing rapidly.\nSystem resource pressure detected.""",
        "memory_leak": f"""{timestamp} WARN {service_name}\nMemory utilization exceeded 90 percent.\nAvailable memory decreasing.\nGarbage collection pressure detected.\nPotential memory leak identified.""",
    }
    return templates.get(
        incident_type,
        f"""{timestamp} ERROR {service_name}\nUnknown production incident detected.\nService health check failed.""",
    ).strip()


def run_root_cause_analysis(
    incident_type: str, service_name: str, logs: str, log_analysis: dict
):
    try:
        return analyze_root_cause(incident_type, service_name, logs, log_analysis)
    except Exception as exc:
        return {
            "status": "root_cause_analysis_failed",
            "root_cause": f"Root cause analysis encountered an error: {exc}",
            "confidence": 0.0,
            "error": str(exc),
        }


# ============================================================
# ENDPOINTS
# ============================================================

@router.get("/active")
def get_active_incidents(db: Session = Depends(get_db)):
    """Retrieve all unresolved active incidents."""
    active = (
        db.query(ActiveIncident)
        .filter(ActiveIncident.status != "resolved")
        .order_by(ActiveIncident.detected_at.desc())
        .all()
    )
    return {
        "count": len(active),
        "active_incidents": [
            {
                "id": inc.id,
                "incident_type": inc.incident_type,
                "affected_service": inc.affected_service,
                "title": inc.title,
                "description": inc.description,
                "status": inc.status,
                "severity": inc.severity,
                "risk_score": inc.risk_score,
                "confidence": inc.confidence,
                "root_cause": inc.root_cause,
                "blast_radius": inc.blast_radius,
                "recommended_action": inc.recommended_action,
                "detected_at": inc.detected_at.isoformat() if inc.detected_at else None,
            }
            for inc in active
        ],
    }


@router.get("/history")
def get_incident_history(
    limit: int = Query(20, ge=1, le=100),
    service: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Retrieve historical incidents record."""
    query = db.query(ActiveIncident).order_by(ActiveIncident.detected_at.desc())
    if service:
        query = query.filter(ActiveIncident.affected_service == service)

    incidents = query.limit(limit).all()
    return {
        "count": len(incidents),
        "history": [
            {
                "id": inc.id,
                "incident_type": inc.incident_type,
                "affected_service": inc.affected_service,
                "title": inc.title,
                "status": inc.status,
                "severity": inc.severity,
                "risk_score": inc.risk_score,
                "root_cause": inc.root_cause,
                "actual_action": inc.actual_action,
                "detected_at": inc.detected_at.isoformat() if inc.detected_at else None,
                "resolved_at": inc.resolved_at.isoformat() if inc.resolved_at else None,
            }
            for inc in incidents
        ],
    }


@router.get("/audit")
def get_remediation_audit(
    limit: int = Query(25, ge=1, le=100),
    service: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Retrieve immutable remediation audit log."""
    query = db.query(RemediationAudit).order_by(RemediationAudit.created_at.desc())
    if service:
        query = query.filter(RemediationAudit.service == service)

    audits = query.limit(limit).all()
    return {
        "count": len(audits),
        "audits": [
            {
                "id": a.id,
                "incident_id": a.incident_id,
                "service": a.service,
                "target": a.target,
                "action": a.action,
                "operator": a.operator,
                "execution_status": a.execution_status,
                "safety_allowed": a.safety_allowed,
                "policy_violations": a.policy_violations,
                "duration_seconds": a.duration_seconds,
                "error_message": a.error_message,
                "timestamp": a.created_at.isoformat() if a.created_at else None,
            }
            for a in audits
        ],
    }


@router.post("/simulate/{incident_type}")
def simulate_incident(
    incident_type: str,
    db: Session = Depends(get_db),
):
    """Simulate microservice failure and ingest active incident."""
    if incident_type not in INCIDENT_CONFIG:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Unsupported incident type.",
                "supported_incidents": list(INCIDENT_CONFIG.keys()),
            },
        )

    config = INCIDENT_CONFIG[incident_type]
    service_name = config["service"]

    service = db.query(Service).filter(Service.name == service_name).first()
    if not service:
        raise HTTPException(
            status_code=404,
            detail=f"Service '{service_name}' not found.",
        )

    before_state = get_docker_service_status(service_name)
    docker_result = stop_docker_service(service_name)

    if not docker_result["success"]:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to simulate Docker failure.",
                "service": service_name,
                "docker_error": docker_result["stderr"],
            },
        )

    time.sleep(1.5)
    after_state = get_docker_service_status(service_name)

    # Update service status in DB
    service.status = "degraded"
    db.commit()
    db.refresh(service)

    # Generate logs and AI analysis
    logs = generate_incident_logs(incident_type, service_name)
    try:
        ai_analysis = analyze_logs(logs)
    except Exception as exc:
        ai_analysis = {
            "status": "log_analysis_failed",
            "error": str(exc),
            "issues": [],
        }

    root_cause_result = run_root_cause_analysis(
        incident_type, service_name, logs, ai_analysis
    )
    if isinstance(root_cause_result, dict):
        root_cause = (
            root_cause_result.get("root_cause")
            or root_cause_result.get("analysis")
            or str(root_cause_result)
        )
        confidence = root_cause_result.get("confidence", 0.85)
    else:
        root_cause = str(root_cause_result)
        confidence = 0.85

    # Compute recursive blast radius
    try:
        impacted_services = get_dependents(service_name)
    except Exception:
        impacted_services = []

    recursive_impacted = []
    visited = {service_name}
    queue = list(impacted_services)
    while queue:
        current = queue.pop(0)
        if current in visited:
            continue
        visited.add(current)
        recursive_impacted.append(current)
        for dep in get_dependents(current):
            if dep not in visited:
                queue.append(dep)

    risk_score = min(100.0, 40.0 + (len(recursive_impacted) * 10.0))

    # Persist into ActiveIncident model
    active_inc = ActiveIncident(
        incident_type=incident_type,
        affected_service=service_name,
        title=config["title"],
        description=config["description"],
        status="active",
        severity="critical" if risk_score >= 70 else "elevated",
        risk_score=float(risk_score),
        confidence=float(confidence),
        root_cause=str(root_cause),
        blast_radius=recursive_impacted,
        ai_analysis=ai_analysis,
        logs_snippet=logs[:500],
    )
    db.add(active_inc)

    # Store into IncidentMemory
    memory = IncidentMemory(
        incident_type=incident_type,
        affected_service=service_name,
        root_cause=str(root_cause),
        recovery_action=None,
        recovery_success=False,
        recovery_time_seconds=None,
        confidence=float(confidence),
        risk_score=float(risk_score),
        lesson=(
            f"{service_name} experienced {incident_type}. Sentinel detected the failure, "
            f"analyzed logs, and identified {len(recursive_impacted)} downstream impacted services."
        ),
    )
    db.add(memory)
    db.commit()
    db.refresh(active_inc)
    db.refresh(memory)

    return {
        "status": "incident_simulated",
        "incident_id": active_inc.id,
        "incident": {
            "id": active_inc.id,
            "type": incident_type,
            "title": config["title"],
            "description": config["description"],
        },
        "service": {
            "name": service_name,
            "database_status": service.status,
            "docker_before": before_state,
            "docker_after": after_state,
        },
        "logs": logs,
        "ai_analysis": ai_analysis,
        "root_cause": {
            "analysis": root_cause,
            "confidence": confidence,
            "details": root_cause_result,
        },
        "impact": {
            "blast_radius": len(recursive_impacted),
            "impacted_services": recursive_impacted,
        },
        "risk_score": risk_score,
        "memory": {
            "id": memory.id,
            "stored": True,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/autonomous-remediate")
def autonomous_remediate(
    request: AutonomousRemediationRequest,
    db: Session = Depends(get_db),
):
    """Execute autonomous remediation governed by the SRE Safety & Policy layer."""
    if not request.approved:
        raise HTTPException(
            status_code=403,
            detail="Autonomous remediation requires explicit approval.",
        )

    # 1. Safety & Policy Layer Check
    safety = evaluate_remediation_safety(
        service_name=request.service,
        action=request.action,
        db=db,
        operator="autonomous_agent",
        force_override=request.force_override,
    )

    if not safety.allowed:
        # Record blocked attempt in Audit
        blocked_audit = RemediationAudit(
            service=request.service,
            target=request.service,
            action=request.action,
            operator="autonomous_agent",
            approved_by="operator" if request.approved else None,
            execution_status="blocked_by_safety_policy",
            safety_allowed=False,
            policy_violations=safety.policy_violations,
            error_message=safety.reason,
        )
        db.add(blocked_audit)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "Remediation blocked by Sentinel Safety Policy.",
                "reason": safety.reason,
                "violations": safety.policy_violations,
                "cooldown_remaining_seconds": safety.cooldown_remaining_seconds,
            },
        )

    service = db.query(Service).filter(Service.name == request.service).first()
    if not service:
        raise HTTPException(
            status_code=404,
            detail=f"Service '{request.service}' does not exist.",
        )

    before_state = get_docker_service_status(request.service)
    start_time = time.time()
    docker_result = None
    remediation_target = request.service

    # Execute remediation
    if request.action == "restart_service":
        docker_result = restart_docker_service(request.service)
    elif request.action == "rollback_deployment":
        docker_result = recreate_docker_service(request.service)
    elif request.action == "restart_dependency":
        dependencies = get_dependencies(request.service)
        if not dependencies:
            raise HTTPException(
                status_code=400,
                detail=f"No dependencies found for {request.service}.",
            )
        remediation_target = dependencies[0]
        docker_result = restart_docker_service(remediation_target)
    elif request.action == "scale_service":
        docker_result = scale_docker_service(request.service)

    recovery_time = time.time() - start_time
    time.sleep(2.5)

    after_state = get_docker_service_status(remediation_target)
    recovery_success = after_state.get("running", False)

    # Update Sentinel service state
    service.status = "healthy" if recovery_success else "degraded"
    db.commit()
    db.refresh(service)

    # Update Active Incident if one exists
    active_inc = (
        db.query(ActiveIncident)
        .filter(
            ActiveIncident.affected_service == request.service,
            ActiveIncident.status != "resolved",
        )
        .order_by(ActiveIncident.detected_at.desc())
        .first()
    )
    if active_inc and recovery_success:
        active_inc.status = "resolved"
        active_inc.resolved_at = datetime.now(timezone.utc)
        active_inc.actual_action = request.action
        active_inc.resolved_by = "autonomous_remediation"
        db.commit()

    # Update latest unresolved incident memory
    memory = (
        db.query(IncidentMemory)
        .filter(IncidentMemory.affected_service == request.service)
        .filter(IncidentMemory.recovery_success == False)
        .order_by(IncidentMemory.created_at.desc())
        .first()
    )
    if memory:
        memory.recovery_action = request.action
        memory.recovery_success = recovery_success
        memory.recovery_time_seconds = recovery_time
        db.commit()
        db.refresh(memory)

    # Write to immutable audit log
    audit_entry = RemediationAudit(
        incident_id=active_inc.id if active_inc else None,
        service=request.service,
        target=remediation_target,
        action=request.action,
        operator="autonomous_agent",
        approved_by="operator" if request.approved else None,
        execution_status="success" if recovery_success else "failed",
        safety_allowed=True,
        policy_violations=[],
        before_state=before_state,
        after_state=after_state,
        duration_seconds=round(recovery_time, 3),
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "remediation_completed" if recovery_success else "remediation_failed",
        "action": request.action,
        "service": request.service,
        "remediation_target": remediation_target,
        "approval": {"approved": request.approved},
        "safety": {"allowed": True, "violations": []},
        "docker": {
            "before": before_state,
            "command_result": docker_result,
            "after": after_state,
        },
        "verification": {
            "success": recovery_success,
            "service_status": service.status,
        },
        "recovery_time_seconds": round(recovery_time, 3),
        "incident_memory": {
            "updated": memory is not None,
            "memory_id": memory.id if memory else None,
        },
        "audit_id": audit_entry.id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/recover")
def recover_incident(
    request: RecoveryRequest = RecoveryRequest(),
    db: Session = Depends(get_db),
):
    """Legacy and UI-facing auto-recovery endpoint."""
    action = request.action or "restart_service"
    services = db.query(Service).filter(Service.status == "degraded").all()

    if not services:
        return {
            "status": "no_degraded_services",
            "action": action,
            "message": "All services are currently healthy.",
        }

    recovered = []
    for service in services:
        if action == "restart_service":
            result = restart_docker_service(service.name)
        elif action == "rollback_deployment":
            result = recreate_docker_service(service.name)
        elif action == "scale_service":
            result = scale_docker_service(service.name)
        else:
            dependencies = get_dependencies(service.name)
            if dependencies:
                result = restart_docker_service(dependencies[0])
            else:
                result = {"success": False, "stderr": "No dependencies available."}

        time.sleep(2)
        state = get_docker_service_status(service.name)
        success = state.get("running", False)

        service.status = "healthy" if success else "degraded"

        # Resolve active incident if present
        active_inc = (
            db.query(ActiveIncident)
            .filter(
                ActiveIncident.affected_service == service.name,
                ActiveIncident.status != "resolved",
            )
            .first()
        )
        if active_inc and success:
            active_inc.status = "resolved"
            active_inc.resolved_at = datetime.now(timezone.utc)
            active_inc.actual_action = action
            active_inc.resolved_by = "recover_endpoint"

        recovered.append(
            {
                "service": service.name,
                "success": success,
                "docker": state,
                "result": result,
            }
        )

    db.commit()
    return {
        "status": "recovery_completed",
        "action": action,
        "services": recovered,
        "message": f"Recovered {len(recovered)} degraded service(s).",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/resolve/{incident_id}")
def resolve_incident(
    incident_id: int,
    db: Session = Depends(get_db),
):
    """Manually resolve an active incident."""
    inc = db.query(ActiveIncident).filter(ActiveIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")

    inc.status = "resolved"
    inc.resolved_at = datetime.now(timezone.utc)
    inc.resolved_by = "operator_manual"

    # Also restore service to healthy
    svc = db.query(Service).filter(Service.name == inc.affected_service).first()
    if svc:
        svc.status = "healthy"

    db.commit()
    return {
        "status": "incident_resolved",
        "incident_id": inc.id,
        "affected_service": inc.affected_service,
        "resolved_at": inc.resolved_at.isoformat(),
    }