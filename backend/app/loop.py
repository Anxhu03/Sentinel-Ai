import time
from datetime import datetime, timezone
from typing import Dict, Optional
from sqlalchemy.orm import Session

from backend.app.decision import evaluate_decision
from backend.app.dependencies import get_dependents
from backend.app.logging_config import logger
from backend.app.memory_model import IncidentMemory
from backend.app.models import ActiveIncident, RemediationAudit, Service
from backend.app.prediction import predict_incident
from backend.app.routers.incidents import (
    get_docker_service_status,
    recreate_docker_service,
    restart_docker_service,
    scale_docker_service,
    generate_incident_logs,
    run_root_cause_analysis,
)
from backend.app.routers.metrics import get_metrics
from agents.log_agent import analyze_logs


def execute_sentinel_loop(
    service_name: str,
    incident_type: str,
    db: Session,
    operator: str = "sentinel_closed_loop",
    auto_act: bool = True,
) -> Dict:
    """
    Execute the full end-to-end 8-stage SRE intelligence loop:
    Observe → Understand → Predict → Simulate → Decide → Act → Verify → Learn
    """
    start_time = time.time()
    loop_log = []

    def step_log(stage: str, details: str):
        msg = f"[{stage.upper()}] {details}"
        loop_log.append(msg)
        logger.info(msg, extra={"service": service_name})

    # =========================================================
    # STAGE 1: OBSERVE
    # =========================================================
    step_log("Observe", f"Collecting live telemetry and container state for {service_name}...")
    before_state = get_docker_service_status(service_name)
    current_metrics = get_metrics()

    # =========================================================
    # STAGE 2: UNDERSTAND
    # =========================================================
    step_log("Understand", f"Correlating log signals, topology blast radius, and RCA for {incident_type}...")
    logs = generate_incident_logs(incident_type, service_name)
    log_analysis = analyze_logs(logs)

    rca_result = run_root_cause_analysis(
        incident_type=incident_type,
        service_name=service_name,
        logs=logs,
        log_analysis=log_analysis,
    )
    root_cause = (
        rca_result.get("root_cause")
        if isinstance(rca_result, dict)
        else str(rca_result)
    )

    try:
        dependents = get_dependents(service_name)
    except Exception:
        dependents = []

    # =========================================================
    # STAGE 3: PREDICT
    # =========================================================
    step_log("Predict", "Calculating trajectory risk score and failure probability...")
    prediction = predict_incident(
        cpu_usage=current_metrics["cpu_usage"],
        memory_usage=current_metrics["memory_usage"],
        api_latency=current_metrics["api_latency"],
        error_rate=current_metrics["error_rate"],
        log_signals=log_analysis.get("issues", []),
        incident_active=True,
        incident_type=incident_type,
    )
    risk_score = prediction.get("risk_score", 50.0)

    # Persist or update Active Incident
    active_incident = (
        db.query(ActiveIncident)
        .filter(
            ActiveIncident.affected_service == service_name,
            ActiveIncident.status != "resolved",
        )
        .first()
    )
    if not active_incident:
        active_incident = ActiveIncident(
            incident_type=incident_type,
            affected_service=service_name,
            title=f"Incident detected on {service_name}",
            description=root_cause,
            status="investigating",
            severity="critical" if risk_score >= 70 else "elevated",
            risk_score=float(risk_score),
            confidence=float(prediction.get("confidence", 0.85)),
            root_cause=root_cause,
            blast_radius=dependents,
            ai_analysis=log_analysis,
            logs_snippet=logs[:500],
        )
        db.add(active_incident)
        db.commit()
        db.refresh(active_incident)

    # =========================================================
    # STAGE 4: SIMULATE & STAGE 5: DECIDE
    # =========================================================
    step_log("Decide", "Evaluating What-If simulations and policy guardrails to select remediation...")
    decision = evaluate_decision(
        service_name=service_name,
        incident_type=incident_type,
        db=db,
        root_cause=root_cause,
        operator=operator,
    )

    active_incident.recommended_action = decision.selected_action
    active_incident.status = "mitigating"
    db.commit()

    # =========================================================
    # STAGE 6: ACT (Remediation Execution)
    # =========================================================
    executed = False
    action_result = None
    remediation_target = service_name
    act_error = None

    if auto_act and decision.is_auto_executable:
        step_log("Act", f"Executing autonomous action: '{decision.selected_action}' on {service_name}...")
        try:
            if decision.selected_action == "restart_service":
                action_result = restart_docker_service(service_name)
            elif decision.selected_action == "rollback_deployment":
                action_result = recreate_docker_service(service_name)
            elif decision.selected_action == "scale_service":
                action_result = scale_docker_service(service_name)
            elif decision.selected_action == "restart_dependency":
                if dependents:
                    remediation_target = dependents[0]
                action_result = restart_docker_service(remediation_target)

            executed = True
        except Exception as exc:
            act_error = str(exc)
            step_log("Act", f"Remediation action failed: {act_error}")
    else:
        step_log(
            "Act",
            f"Autonomous action held ({decision.safety_evaluation.reason}). Awaiting manual operator approval.",
        )

    # =========================================================
    # STAGE 7: VERIFY
    # =========================================================
    recovery_success = False
    after_state = {}

    if executed:
        step_log("Verify", "Running post-recovery health probe and verification check...")
        time.sleep(2)
        after_state = get_docker_service_status(remediation_target)
        recovery_success = after_state.get("running", False)

        # Update service database status
        service = db.query(Service).filter(Service.name == service_name).first()
        if service:
            service.status = "healthy" if recovery_success else "degraded"
            db.commit()

        if recovery_success:
            active_incident.status = "resolved"
            active_incident.resolved_at = datetime.now(timezone.utc)
            active_incident.actual_action = decision.selected_action
            active_incident.resolved_by = operator
            db.commit()

    # =========================================================
    # STAGE 8: LEARN (Incident Memory & Audit Recording)
    # =========================================================
    duration = time.time() - start_time
    step_log("Learn", f"Recording operational lessons into Incident Memory (success={recovery_success})...")

    # Record Audit
    audit_entry = RemediationAudit(
        incident_id=active_incident.id if active_incident else None,
        service=service_name,
        target=remediation_target,
        action=decision.selected_action,
        operator=operator,
        approved_by="auto_decision_engine" if auto_act else None,
        execution_status=(
            "success"
            if recovery_success
            else (
                "failed"
                if executed
                else (
                    "blocked_by_safety_policy"
                    if not decision.safety_evaluation.allowed
                    else "pending_approval"
                )
            )
        ),
        safety_allowed=decision.safety_evaluation.allowed,
        policy_violations=decision.safety_evaluation.policy_violations,
        before_state=before_state,
        after_state=after_state,
        duration_seconds=round(duration, 3),
        error_message=act_error,
    )
    db.add(audit_entry)

    # Record Incident Memory
    memory_lesson = (
        f"{service_name} experienced {incident_type}. Action '{decision.selected_action}' "
        f"was {'successfully executed and verified' if recovery_success else 'attempted'} in {round(duration, 1)}s."
    )
    mem_entry = IncidentMemory(
        incident_type=incident_type,
        affected_service=service_name,
        root_cause=root_cause,
        recovery_action=decision.selected_action,
        recovery_success=recovery_success,
        recovery_time_seconds=round(duration, 2),
        confidence=float(decision.confidence),
        risk_score=float(risk_score),
        lesson=memory_lesson,
    )
    db.add(mem_entry)
    db.commit()

    return {
        "status": "loop_completed",
        "service": service_name,
        "incident_type": incident_type,
        "incident_id": active_incident.id if active_incident else None,
        "observe": {"before_state": before_state, "telemetry": current_metrics},
        "understand": {"root_cause": root_cause, "blast_radius": dependents},
        "predict": prediction,
        "decide": decision.dict(),
        "act": {
            "executed": executed,
            "target": remediation_target,
            "action": decision.selected_action,
            "command_result": action_result,
        },
        "verify": {
            "verified_healthy": recovery_success,
            "after_state": after_state,
        },
        "learn": {
            "memory_stored": True,
            "audit_id": audit_entry.id,
            "lesson": memory_lesson,
        },
        "loop_duration_seconds": round(duration, 3),
        "execution_log": loop_log,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
