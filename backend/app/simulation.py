from typing import List, Dict

from backend.app.database import SessionLocal
from backend.app.memory_model import IncidentMemory


REMEDIATION_ACTIONS = {
    "restart_service": {
        "name": "Restart Service",
        "description": "Restart the affected service and verify recovery.",
        "base_recovery": 0.92,
        "base_risk": "Low",
        "impact": "Low",
        "estimated_seconds": 25,
    },
    "rollback_deployment": {
        "name": "Rollback Deployment",
        "description": "Rollback the latest deployment to the previous stable version.",
        "base_recovery": 0.96,
        "base_risk": "Medium",
        "impact": "Medium",
        "estimated_seconds": 45,
    },
    "restart_dependency": {
        "name": "Restart Dependency",
        "description": "Restart a critical dependency of the affected service.",
        "base_recovery": 0.78,
        "base_risk": "Medium",
        "impact": "Medium",
        "estimated_seconds": 40,
    },
    "scale_service": {
        "name": "Scale Service",
        "description": "Increase service capacity to reduce resource pressure.",
        "base_recovery": 0.84,
        "base_risk": "Low",
        "impact": "Low",
        "estimated_seconds": 60,
    },
}


def _risk_score(risk: str) -> int:
    return {
        "Low": 20,
        "Medium": 45,
        "High": 75,
    }.get(risk, 50)


def _get_memory_context(
    service_name: str,
    incident_type: str,
) -> Dict:
    """
    Retrieve previous incidents that match the current
    service and incident type.

    Only successful historical recovery actions that match
    known remediation actions are used to influence decisions.
    """

    db = SessionLocal()

    try:
        memories = (
            db.query(IncidentMemory)
            .filter(
                IncidentMemory.incident_type == incident_type,
                IncidentMemory.affected_service == service_name,
            )
            .order_by(
                IncidentMemory.created_at.desc()
            )
            .limit(20)
            .all()
        )

        successful_memories = [
            memory
            for memory in memories
            if memory.recovery_success
        ]

        action_counts = {}

        for memory in successful_memories:
            action = memory.recovery_action

            if action in REMEDIATION_ACTIONS:
                action_counts[action] = (
                    action_counts.get(action, 0) + 1
                )

        learned_action = None

        if action_counts:
            learned_action = max(
                action_counts,
                key=action_counts.get,
            )

        return {
            "similar_incidents": len(memories),
            "successful_incidents": len(successful_memories),
            "learned_action": learned_action,
            "action_history": action_counts,
            "learning_available": learned_action is not None,
        }

    finally:
        db.close()


def simulate_action(
    service_name: str,
    action_key: str,
    incident_type: str = "unknown",
    memory_context: Dict = None,
) -> Dict:
    action = REMEDIATION_ACTIONS[action_key]

    recovery_probability = action["base_recovery"]
    risk_score = _risk_score(action["base_risk"])

    if incident_type == "payment_failure":
        if action_key == "rollback_deployment":
            recovery_probability += 0.02
        elif action_key == "restart_service":
            recovery_probability += 0.01

    elif incident_type == "cpu_spike":
        if action_key == "scale_service":
            recovery_probability += 0.08

    elif incident_type == "memory_leak":
        if action_key == "restart_service":
            recovery_probability += 0.05

    elif incident_type == "db_down":
        if action_key == "restart_dependency":
            recovery_probability += 0.06

    memory_boost = 0

    if memory_context:
        learned_action = memory_context.get("learned_action")

        if learned_action == action_key:
            memory_boost = min(
                0.04,
                memory_context.get("successful_incidents", 0) * 0.01,
            )

            recovery_probability += memory_boost

    recovery_probability = min(
        recovery_probability,
        0.99,
    )

    decision_score = (
        recovery_probability * 100
        - risk_score * 0.35
    )

    return {
        "action": action_key,
        "action_name": action["name"],
        "description": action["description"],
        "service": service_name,
        "incident_type": incident_type,
        "recovery_probability": round(
            recovery_probability * 100
        ),
        "risk": action["base_risk"],
        "risk_score": risk_score,
        "impact": action["impact"],
        "estimated_recovery_seconds": action[
            "estimated_seconds"
        ],
        "decision_score": round(
            decision_score,
            2,
        ),
        "memory_boost": round(
            memory_boost * 100,
            2,
        ),
    }


def compare_actions(
    service_name: str,
    incident_type: str = "unknown",
) -> Dict:
    memory_context = _get_memory_context(
        service_name=service_name,
        incident_type=incident_type,
    )

    scenarios: List[Dict] = []

    for action_key in REMEDIATION_ACTIONS:
        scenario = simulate_action(
            service_name=service_name,
            action_key=action_key,
            incident_type=incident_type,
            memory_context=memory_context,
        )

        scenarios.append(scenario)

    scenarios.sort(
        key=lambda scenario: scenario["decision_score"],
        reverse=True,
    )

    recommended = scenarios[0]

    if memory_context["learning_available"]:
        decision_message = (
            "Recommendation combines baseline recovery analysis "
            "with successful historical incident memory."
        )
    elif memory_context["similar_incidents"] > 0:
        decision_message = (
            "Similar incidents were found, but no compatible "
            "successful remediation action has been learned yet."
        )
    else:
        decision_message = (
            "No matching incident memory was available. "
            "Recommendation is based on recovery-to-risk analysis."
        )

    return {
        "engine": "Sentinel Memory-Augmented What-If Decision Engine",
        "status": "simulation_complete",
        "service": service_name,
        "incident_type": incident_type,
        "scenario_count": len(scenarios),

        "memory_context": {
            "similar_incidents": memory_context[
                "similar_incidents"
            ],
            "successful_incidents": memory_context[
                "successful_incidents"
            ],
            "learned_action": memory_context[
                "learned_action"
            ],
            "action_history": memory_context[
                "action_history"
            ],
            "learning_available": memory_context[
                "learning_available"
            ],
        },

        "scenarios": scenarios,
        "comparison": scenarios,
        "recommended_action": {
            "action": recommended["action"],
            "name": recommended["action_name"],
            "recovery_probability": recommended[
                "recovery_probability"
            ],
            "risk": recommended["risk"],
            "impact": recommended["impact"],
            "estimated_recovery_seconds": recommended[
                "estimated_recovery_seconds"
            ],
            "memory_boost": recommended[
                "memory_boost"
            ],
        },
        "optimal_action": {
            "action": recommended["action"],
            "name": recommended["action_name"],
            "recovery_probability": recommended[
                "recovery_probability"
            ],
            "risk": recommended["risk"],
            "impact": recommended["impact"],
            "estimated_recovery_seconds": recommended[
                "estimated_recovery_seconds"
            ],
            "memory_boost": recommended[
                "memory_boost"
            ],
        },

        "decision": decision_message,
    }


def simulate_remediation(
    action: str,
    service_name: str,
    incident_type: str = "unknown",
    base_risk_score: float = 50.0,
) -> Dict:
    res = simulate_action(
        service_name=service_name,
        action_key=action,
        incident_type=incident_type,
    )
    recovery_prob = res["recovery_probability"] / 100.0
    risk_red = max(5.0, float(base_risk_score) - float(res["risk_score"]))
    return {
        "action": action,
        "service": service_name,
        "incident_type": incident_type,
        "simulated_recovery_probability": recovery_prob,
        "predicted_risk_reduction": risk_red,
        "estimated_recovery_seconds": res["estimated_recovery_seconds"],
        "risk_level": res["risk"],
        "decision_score": res["decision_score"],
    }

