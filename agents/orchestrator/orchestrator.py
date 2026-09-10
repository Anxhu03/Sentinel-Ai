from datetime import datetime, timezone

import httpx

from agents.log_agent import analyze_logs
from agents.rca_agent import analyze_root_cause


MEMORY_API = "http://127.0.0.1:8000/api/memory/similar"


def retrieve_incident_memory(
    incident_type: str,
    affected_service: str | None,
    limit: int = 5,
) -> dict:
    """Retrieve similar historical incidents from Sentinel Memory."""

    try:
        response = httpx.get(
            MEMORY_API,
            params={
                "incident_type": incident_type,
                "affected_service": affected_service,
                "limit": limit,
            },
            timeout=5.0,
        )

        response.raise_for_status()

        data = response.json()
        memories = data.get("memories", [])

        successful = [
            memory
            for memory in memories
            if memory.get("recovery_success") is True
        ]

        return {
            "status": (
                "memory_found"
                if memories
                else "no_matching_memory"
            ),
            "count": len(memories),
            "successful_recoveries": len(successful),
            "memories": memories,
        }

    except Exception as exc:
        return {
            "status": "memory_unavailable",
            "count": 0,
            "successful_recoveries": 0,
            "memories": [],
            "error": str(exc),
        }


def build_memory_insight(memory_result: dict) -> dict:
    """Convert historical incidents into operational intelligence."""

    memories = memory_result.get("memories", [])

    if not memories:
        return {
            "available": False,
            "insight": "No matching historical incidents were found.",
            "recommended_action": None,
            "historical_confidence": 0,
        }

    successful = [
        memory
        for memory in memories
        if memory.get("recovery_success") is True
    ]

    actions = [
        memory.get("recovery_action")
        for memory in successful
        if memory.get("recovery_action")
    ]

    causes = [
        memory.get("root_cause")
        for memory in successful
        if memory.get("root_cause")
    ]

    lessons = [
        memory.get("lesson")
        for memory in successful
        if memory.get("lesson")
    ]

    confidence_values = [
        memory.get("confidence")
        for memory in successful
        if isinstance(
            memory.get("confidence"),
            (int, float),
        )
    ]

    historical_confidence = (
        round(
            sum(confidence_values)
            / len(confidence_values),
            2,
        )
        if confidence_values
        else 0
    )

    return {
        "available": True,
        "total_matches": len(memories),
        "successful_recoveries": len(successful),
        "previous_root_causes": causes,
        "previous_recovery_actions": actions,
        "previous_lessons": lessons,
        "historical_confidence": historical_confidence,
        "insight": (
            f"Sentinel found {len(memories)} similar "
            f"historical incident(s), including "
            f"{len(successful)} successful recovery case(s)."
        ),
        "recommended_action": (
            actions[0]
            if actions
            else None
        ),
    }


def investigate_incident(
    incident_type: str,
    affected_service: str | None,
    logs: str,
) -> dict:
    """
    Sentinel AI Core Orchestrator.

    Pipeline:

        Incident
            |
        Log Agent
            |
        Incident Memory
            |
        RCA Agent
            |
        Unified Investigation
    """

    incident_type = (
        incident_type or "unknown"
    ).strip().lower()

    affected_service = (
        affected_service.strip()
        if affected_service
        else None
    )

    logs = logs or ""

    # STEP 1 — LOG INTELLIGENCE

    log_analysis = analyze_logs(logs)

    # STEP 2 — HISTORICAL INCIDENT MEMORY

    memory_result = retrieve_incident_memory(
        incident_type=incident_type,
        affected_service=affected_service,
    )

    memory_insight = build_memory_insight(
        memory_result
    )

    # STEP 3 — ROOT CAUSE ANALYSIS

    rca_analysis = analyze_root_cause(
        incident_type=incident_type,
        affected_service=affected_service,
        logs=logs,
        log_analysis=log_analysis,
    )

    # STEP 4 — FINAL STATUS

    status = "investigation_complete"

    if log_analysis.get("status") == "no_data":
        status = "insufficient_evidence"

    return {
        "status": status,

        "incident": {
            "type": incident_type,
            "affected_service": affected_service,
        },

        "log_analysis": log_analysis,

        "historical_memory": memory_result,

        "memory_insight": memory_insight,

        "root_cause_analysis": rca_analysis,

        "summary": {
            "severity": log_analysis.get(
                "severity",
                "low",
            ),

            "root_cause": rca_analysis.get(
                "root_cause",
                "Unknown production issue",
            ),

            "confidence": rca_analysis.get(
                "confidence",
                0,
            ),

            "impact": rca_analysis.get(
                "impact",
                "Potential service degradation detected.",
            ),

            "recommendation": rca_analysis.get(
                "recommendation",
                "Investigate the affected service.",
            ),

            "historical_context": memory_insight.get(
                "insight"
            ),

            "previous_successful_action": memory_insight.get(
                "recommended_action"
            ),
        },

        "orchestrator": {
            "agents_executed": [
                "log_agent",
                "incident_memory",
                "rca_agent",
            ],

            "timestamp": datetime.now(
                timezone.utc
            ).isoformat(),
        },
    }