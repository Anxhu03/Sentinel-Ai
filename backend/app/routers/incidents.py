import json
import os
import subprocess
import time
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal
from backend.app.models import Service
from backend.app.memory_model import IncidentMemory

from backend.app.dependencies import (
    get_dependencies,
    get_dependents,
)

from agents.log_agent import analyze_logs
from agents.rca_agent import analyze_root_cause


router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"],
)


# ============================================================
# DATABASE
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# DOCKER CONFIGURATION
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../")
)

DOCKER_TIMEOUT = 30


def docker_compose_command(*args):
    """
    Build a Docker Compose command that always uses
    Sentinel AI's root docker-compose.yml.
    """

    compose_dir = os.getenv(
        "SENTINEL_COMPOSE_DIR",
        PROJECT_ROOT,
    )

    compose_file = os.path.join(
        compose_dir,
        "docker-compose.yml",
    )

    return [
        "docker",
        "compose",
        "-f",
        compose_file,
        *args,
    ]


def run_docker_command(args):
    """
    Execute Docker safely without shell=True.
    """

    try:
        result = subprocess.run(
            args,
            cwd=PROJECT_ROOT,
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
        return {
            "success": False,
            "return_code": -1,
            "stdout": "",
            "stderr": "Docker command timed out.",
        }

    except Exception as exc:
        return {
            "success": False,
            "return_code": -1,
            "stdout": "",
            "stderr": str(exc),
        }


# ============================================================
# DOCKER SERVICE STATUS
# ============================================================

def get_docker_service_status(service_name: str):
    """
    Get the current Docker Compose state for a service.
    """

    command = docker_compose_command(
        "ps",
        "-a",
        "--format",
        "{{json .}}",
        service_name,
    )

    result = run_docker_command(command)

    if not result["success"]:
        return {
            "service": service_name,
            "status": "unknown",
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

        status = (
            data.get("State")
            or data.get("Status")
            or "unknown"
        )

        status_lower = str(status).lower()

        running = (
            "running" in status_lower
            or status_lower.startswith("up")
        )

        return {
            "service": service_name,
            "status": status,
            "running": running,
            "docker_available": True,
            "container": data.get("Name"),
            "image": data.get("Image"),
        }

    except Exception:
        output_lower = output.lower()

        running = (
            "running" in output_lower
            or "up " in output_lower
        )

        return {
            "service": service_name,
            "status": output,
            "running": running,
            "docker_available": True,
        }


# ============================================================
# DOCKER ACTIONS
# ============================================================

def stop_docker_service(service_name: str):
    command = docker_compose_command(
        "stop",
        service_name,
    )

    return run_docker_command(command)


def restart_docker_service(service_name: str):
    command = docker_compose_command(
        "restart",
        service_name,
    )

    return run_docker_command(command)


def recreate_docker_service(service_name: str):
    command = docker_compose_command(
        "up",
        "-d",
        "--force-recreate",
        service_name,
    )

    return run_docker_command(command)


def scale_docker_service(service_name: str):
    command = docker_compose_command(
        "up",
        "-d",
        "--scale",
        f"{service_name}=2",
        "--no-recreate",
        service_name,
    )

    return run_docker_command(command)


# ============================================================
# INCIDENT CONFIGURATION
# ============================================================

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


# ============================================================
# REQUEST MODELS
# ============================================================

class AutonomousRemediationRequest(BaseModel):
    action: str
    service: str
    incident_type: Optional[str] = None
    approved: bool = False


class RecoveryRequest(BaseModel):
    action: str


# ============================================================
# INCIDENT LOG GENERATION
# ============================================================

def generate_incident_logs(
    incident_type: str,
    service_name: str,
):
    timestamp = datetime.now(timezone.utc).isoformat()

    log_templates = {

        "db_down": f"""
{timestamp} ERROR {service_name}
Database connection failed.
Connection refused.
Database dependency unavailable.
Request processing aborted.
""",

        "payment_failure": f"""
{timestamp} ERROR {service_name}
Payment gateway request failed.
Payment transaction timeout.
Upstream payment dependency unavailable.
Transaction rejected.
""",

        "order_crash": f"""
{timestamp} ERROR {service_name}
Order service process became unavailable.
HTTP connection refused.
Health check failed.
Container stopped unexpectedly.
""",

        "api_failure": f"""
{timestamp} ERROR {service_name}
Product API returned HTTP 500.
Upstream request failed.
API health check failed.
Service response latency increased.
""",

        "cpu_spike": f"""
{timestamp} WARN {service_name}
CPU utilization exceeded 95 percent.
Request processing latency increased.
Worker queue growing rapidly.
System resource pressure detected.
""",

        "memory_leak": f"""
{timestamp} WARN {service_name}
Memory utilization exceeded 90 percent.
Available memory decreasing.
Garbage collection pressure detected.
Potential memory leak identified.
""",
    }

    return log_templates.get(
        incident_type,
        f"""
{timestamp} ERROR {service_name}
Unknown production incident detected.
Service health check failed.
""",
    ).strip()


# ============================================================
# ROOT CAUSE ANALYSIS
# ============================================================

def run_root_cause_analysis(
    incident_type: str,
    service_name: str,
    logs: str,
    log_analysis: dict,
):
    """
    Call the RCA agent using its actual four-argument signature.
    """

    try:
        return analyze_root_cause(
            incident_type,
            service_name,
            logs,
            log_analysis,
        )

    except Exception as exc:
        return {
            "status": "root_cause_analysis_failed",
            "root_cause": (
                f"Root cause analysis encountered an error: {exc}"
            ),
            "confidence": 0.0,
            "error": str(exc),
        }


# ============================================================
# SIMULATE INCIDENT
# ============================================================

@router.post("/simulate/{incident_type}")
def simulate_incident(
    incident_type: str,
    db: Session = Depends(get_db),
):

    if incident_type not in INCIDENT_CONFIG:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Unsupported incident type.",
                "supported_incidents": list(
                    INCIDENT_CONFIG.keys()
                ),
            },
        )

    config = INCIDENT_CONFIG[incident_type]

    service_name = config["service"]

    # --------------------------------------------------------
    # Verify service exists in database
    # --------------------------------------------------------

    service = (
        db.query(Service)
        .filter(Service.name == service_name)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail=f"Service '{service_name}' not found.",
        )

    # --------------------------------------------------------
    # Get current Docker state
    # --------------------------------------------------------

    before_state = get_docker_service_status(
        service_name
    )

    # --------------------------------------------------------
    # Stop the REAL Docker service
    # --------------------------------------------------------

    docker_result = stop_docker_service(
        service_name
    )

    if not docker_result["success"]:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to simulate Docker failure.",
                "service": service_name,
                "docker_error": docker_result["stderr"],
            },
        )

    time.sleep(2)

    after_state = get_docker_service_status(
        service_name
    )

    # --------------------------------------------------------
    # Mark service degraded in Sentinel database
    # --------------------------------------------------------

    service.status = "degraded"

    db.commit()
    db.refresh(service)

    # --------------------------------------------------------
    # Generate incident logs
    # --------------------------------------------------------

    logs = generate_incident_logs(
        incident_type,
        service_name,
    )

    # --------------------------------------------------------
    # AI LOG ANALYSIS
    # --------------------------------------------------------

    try:
        ai_analysis = analyze_logs(logs)

    except Exception as exc:
        ai_analysis = {
            "status": "log_analysis_failed",
            "error": str(exc),
            "message": "Log analysis failed.",
            "issues": [],
        }

    # --------------------------------------------------------
    # AI ROOT CAUSE ANALYSIS
    # --------------------------------------------------------

    root_cause_result = run_root_cause_analysis(
        incident_type,
        service_name,
        logs,
        ai_analysis,
    )

    if isinstance(root_cause_result, dict):

        root_cause = (
            root_cause_result.get("root_cause")
            or root_cause_result.get("analysis")
            or str(root_cause_result)
        )

        confidence = root_cause_result.get(
            "confidence",
            0.85,
        )

    else:

        root_cause = str(root_cause_result)
        confidence = 0.85

    # --------------------------------------------------------
    # Blast radius
    # --------------------------------------------------------

    impacted_services = []

    try:
        impacted_services = get_dependents(
            service_name
        )

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

        for dependent in get_dependents(current):

            if dependent not in visited:
                queue.append(dependent)

    # --------------------------------------------------------
    # Risk score
    # --------------------------------------------------------

    risk_score = min(
        100.0,
        40.0 + (
            len(recursive_impacted) * 10.0
        ),
    )

    # --------------------------------------------------------
    # Persistent incident memory
    # --------------------------------------------------------

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
            f"{service_name} experienced "
            f"{incident_type}. "
            f"Sentinel detected the failure, "
            f"analyzed the available logs, "
            f"and identified {len(recursive_impacted)} "
            f"downstream impacted services."
        ),
    )

    db.add(memory)
    db.commit()
    db.refresh(memory)

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "status": "incident_simulated",

        "incident": {
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

        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),
    }


# ============================================================
# AUTONOMOUS REMEDIATION
# ============================================================

@router.post("/autonomous-remediate")
def autonomous_remediate(
    request: AutonomousRemediationRequest,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Safety approval
    # --------------------------------------------------------

    if not request.approved:
        raise HTTPException(
            status_code=403,
            detail=(
                "Autonomous remediation requires "
                "explicit approval."
            ),
        )

    allowed_actions = {
        "restart_service",
        "rollback_deployment",
        "restart_dependency",
        "scale_service",
    }

    if request.action not in allowed_actions:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Unsupported remediation action.",
                "allowed_actions": list(
                    allowed_actions
                ),
            },
        )

    # --------------------------------------------------------
    # Verify service
    # --------------------------------------------------------

    service = (
        db.query(Service)
        .filter(Service.name == request.service)
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Service '{request.service}' "
                "does not exist."
            ),
        )

    # --------------------------------------------------------
    # Capture initial state
    # --------------------------------------------------------

    before_state = get_docker_service_status(
        request.service
    )

    start_time = time.time()

    docker_result = None
    remediation_target = request.service

    # --------------------------------------------------------
    # Execute remediation
    # --------------------------------------------------------

    if request.action == "restart_service":

        docker_result = restart_docker_service(
            request.service
        )

    elif request.action == "rollback_deployment":

        docker_result = recreate_docker_service(
            request.service
        )

    elif request.action == "restart_dependency":

        dependencies = get_dependencies(
            request.service
        )

        if not dependencies:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"No dependencies found for "
                    f"{request.service}."
                ),
            )

        dependency = dependencies[0]
        remediation_target = dependency

        docker_result = restart_docker_service(
            dependency
        )

    elif request.action == "scale_service":

        docker_result = scale_docker_service(
            request.service
        )

    recovery_time = (
        time.time() - start_time
    )

    # --------------------------------------------------------
    # Verify Docker recovery
    # --------------------------------------------------------

    time.sleep(3)

    after_state = get_docker_service_status(
        remediation_target
    )

    recovery_success = after_state.get(
        "running",
        False,
    )

    # --------------------------------------------------------
    # Update Sentinel service state
    # --------------------------------------------------------

    if recovery_success:
        service.status = "healthy"
    else:
        service.status = "degraded"

    db.commit()
    db.refresh(service)

    # --------------------------------------------------------
    # Update latest unresolved incident memory
    # --------------------------------------------------------

    memory = (
        db.query(IncidentMemory)
        .filter(
            IncidentMemory.affected_service
            == request.service
        )
        .filter(
            IncidentMemory.recovery_success
            == False
        )
        .order_by(
            IncidentMemory.created_at.desc()
        )
        .first()
    )

    if memory:

        memory.recovery_action = request.action

        memory.recovery_success = recovery_success

        memory.recovery_time_seconds = (
            recovery_time
        )

        db.commit()
        db.refresh(memory)

    # --------------------------------------------------------
    # Audit response
    # --------------------------------------------------------

    return {
        "status": (
            "remediation_completed"
            if recovery_success
            else "remediation_failed"
        ),

        "action": request.action,

        "service": request.service,

        "remediation_target": remediation_target,

        "approval": {
            "approved": request.approved,
        },

        "docker": {
            "before": before_state,
            "command_result": docker_result,
            "after": after_state,
        },

        "verification": {
            "success": recovery_success,
            "service_status": service.status,
        },

        "recovery_time_seconds": round(
            recovery_time,
            3,
        ),

        "incident_memory": {
            "updated": memory is not None,
            "memory_id": (
                memory.id
                if memory
                else None
            ),
        },

        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),
    }


# ============================================================
# LEGACY RECOVERY ENDPOINT
# ============================================================

@router.post("/recover")
def recover_incident(
    request: RecoveryRequest,
    db: Session = Depends(get_db),
):

    allowed_actions = {
        "restart_service",
        "rollback_deployment",
        "restart_dependency",
        "scale_service",
    }

    if request.action not in allowed_actions:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Unsupported recovery action.",
                "allowed_actions": list(
                    allowed_actions
                ),
            },
        )

    services = (
        db.query(Service)
        .filter(Service.status == "degraded")
        .all()
    )

    if not services:
        return {
            "status": "no_degraded_services",
            "action": request.action,
        }

    recovered = []

    for service in services:

        if request.action == "restart_service":

            result = restart_docker_service(
                service.name
            )

        elif request.action == "rollback_deployment":

            result = recreate_docker_service(
                service.name
            )

        elif request.action == "scale_service":

            result = scale_docker_service(
                service.name
            )

        else:

            dependencies = get_dependencies(
                service.name
            )

            if dependencies:

                result = restart_docker_service(
                    dependencies[0]
                )

            else:

                result = {
                    "success": False,
                    "stderr": (
                        "No dependencies available."
                    ),
                }

        time.sleep(2)

        state = get_docker_service_status(
            service.name
        )

        success = state.get(
            "running",
            False,
        )

        service.status = (
            "healthy"
            if success
            else "degraded"
        )

        recovered.append({
            "service": service.name,
            "success": success,
            "docker": state,
            "result": result,
        })

    db.commit()

    return {
        "status": "recovery_completed",
        "action": request.action,
        "services": recovered,
        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),
    }