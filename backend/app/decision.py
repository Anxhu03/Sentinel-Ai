from typing import Dict, List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.memory_model import IncidentMemory
from backend.app.safety import (
    ALLOWED_REMEDIATION_ACTIONS,
    SafetyEvaluation,
    evaluate_remediation_safety,
)
from backend.app.simulation import compare_actions

# Default action affinity by incident type
ACTION_AFFINITIES = {
    "payment_failure": "restart_service",
    "order_crash": "restart_service",
    "api_failure": "restart_service",
    "db_down": "restart_dependency",
    "cpu_spike": "scale_service",
    "memory_leak": "restart_service",
}


class CandidateEvaluation(BaseModel):
    action: str
    name: str
    composite_score: float
    simulated_recovery_rate: float
    historical_success_rate: float
    estimated_recovery_seconds: int
    safety_allowed: bool
    requires_approval: bool
    policy_reason: str


class DecisionBundle(BaseModel):
    service_name: str
    incident_type: str
    selected_action: str
    confidence: float
    rationale: str
    predicted_risk_reduction_pct: float
    is_auto_executable: bool
    safety_evaluation: SafetyEvaluation
    candidate_matrix: List[CandidateEvaluation]


def evaluate_decision(
    service_name: str,
    incident_type: str,
    db: Session,
    root_cause: Optional[str] = None,
    operator: str = "autonomous_agent",
) -> DecisionBundle:
    """
    Unified AI Decision Engine.

    Synthesizes:
    - Root cause analysis
    - What-If simulation projections
    - Historical incident memory track records
    - Operational safety policies
    """
    # 1. Retrieve simulated action comparisons
    simulation_result = compare_actions(
        service_name=service_name,
        incident_type=incident_type,
    )
    simulated_actions = {
        item["action"]: item for item in simulation_result.get("comparison", [])
    }

    # 2. Historical memory statistics
    historical_memories = (
        db.query(IncidentMemory)
        .filter(
            IncidentMemory.incident_type == incident_type,
            IncidentMemory.affected_service == service_name,
        )
        .all()
    )

    action_success_counts: Dict[str, int] = {}
    action_total_counts: Dict[str, int] = {}

    for mem in historical_memories:
        act = mem.recovery_action
        if act:
            action_total_counts[act] = action_total_counts.get(act, 0) + 1
            if mem.recovery_success:
                action_success_counts[act] = (
                    action_success_counts.get(act, 0) + 1
                )

    # 3. Evaluate each candidate action
    candidates: List[CandidateEvaluation] = []
    preferred_default = ACTION_AFFINITIES.get(incident_type, "restart_service")

    for action in ALLOWED_REMEDIATION_ACTIONS:
        sim_data = simulated_actions.get(action, {})
        recovery_rate = sim_data.get("simulated_recovery_probability", 0.8)
        est_seconds = sim_data.get("estimated_recovery_seconds", 30)

        # Historical score (default 0.75 if no history)
        tot = action_total_counts.get(action, 0)
        succ = action_success_counts.get(action, 0)
        hist_rate = (succ / tot) if tot > 0 else 0.75

        # Safety evaluation
        safety = evaluate_remediation_safety(
            service_name=service_name,
            action=action,
            db=db,
            operator=operator,
        )

        # Domain affinity bonus
        affinity_bonus = 0.15 if action == preferred_default else 0.0

        # Composite score calculation (0.0 - 1.0)
        composite = (recovery_rate * 0.45) + (hist_rate * 0.35) + affinity_bonus
        if not safety.allowed:
            composite *= 0.3  # Severe penalty if blocked by policy

        candidates.append(
            CandidateEvaluation(
                action=action,
                name=sim_data.get("action_name", action.replace("_", " ").title()),
                composite_score=round(composite, 3),
                simulated_recovery_rate=round(recovery_rate, 3),
                historical_success_rate=round(hist_rate, 3),
                estimated_recovery_seconds=est_seconds,
                safety_allowed=safety.allowed,
                requires_approval=safety.requires_manual_approval,
                policy_reason=safety.reason,
            )
        )

    # Sort candidates by composite score descending
    candidates.sort(key=lambda c: c.composite_score, reverse=True)
    best_candidate = candidates[0]

    # Overall safety evaluation for the selected action
    selected_safety = evaluate_remediation_safety(
        service_name=service_name,
        action=best_candidate.action,
        db=db,
        operator=operator,
    )

    # Decision Confidence
    confidence_score = min(99.0, max(65.0, best_candidate.composite_score * 100))

    # Auto executable check
    is_auto = (
        selected_safety.allowed
        and not selected_safety.requires_manual_approval
        and confidence_score >= 70.0
    )

    # Build clear human-readable rationale
    rationale = (
        f"Selected '{best_candidate.name}' based on {int(best_candidate.simulated_recovery_rate * 100)}% "
        f"simulated recovery probability and {int(best_candidate.historical_success_rate * 100)}% "
        f"historical incident memory recovery rate."
    )
    if not selected_safety.allowed:
        rationale += f" Note: Action blocked by policy guardrails ({selected_safety.reason})."

    predicted_risk_reduction = round(
        (simulation_result.get("optimal_action", {}).get("risk_reduction", 65.0)),
        1,
    )

    return DecisionBundle(
        service_name=service_name,
        incident_type=incident_type,
        selected_action=best_candidate.action,
        confidence=round(confidence_score, 1),
        rationale=rationale,
        predicted_risk_reduction_pct=predicted_risk_reduction,
        is_auto_executable=is_auto,
        safety_evaluation=selected_safety,
        candidate_matrix=candidates,
    )
