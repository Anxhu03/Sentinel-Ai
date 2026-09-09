from datetime import datetime


def analyze_root_cause(
    incident_type: str,
    affected_service: str | None,
    logs: str,
    log_analysis: dict,
) -> dict:
    """
    Sentinel Root Cause Analysis Agent.

    Uses the incident context and Log Agent findings to produce:
    - probable root cause
    - evidence
    - impact
    - recommended action
    """

    incident_type = incident_type.lower()

    root_cause = "Unknown production issue"
    impact = "Potential service degradation detected."
    recommendation = "Investigate the affected service and review recent logs."
    confidence = 70

    # Database failure
    if incident_type == "db_down":
        root_cause = (
            "Database connectivity failure affecting the "
            f"{affected_service or 'affected'} service."
        )

        impact = (
            "Inventory database operations may fail, which can "
            "affect product availability and downstream order processing."
        )

        recommendation = (
            "Restore PostgreSQL connectivity, verify database health, "
            "and check the inventory-service connection pool."
        )

        confidence = 97

    # Payment failure
    elif incident_type == "payment_failure":
        root_cause = (
            "Payment provider communication failure or payment-service "
            "request timeout."
        )

        impact = (
            "Customers may be unable to complete payments, potentially "
            "causing failed or abandoned orders."
        )

        recommendation = (
            "Verify the payment provider, inspect timeout rates, "
            "and retry failed payment requests safely."
        )

        confidence = 94

    # Order crash
    elif incident_type == "order_crash":
        root_cause = (
            f"Application failure caused the "
            f"{affected_service or 'order'} service to become unavailable."
        )

        impact = (
            "Order creation and processing may be unavailable "
            "for customers."
        )

        recommendation = (
            "Inspect the crashed process, review the latest deployment, "
            "and restart the service after identifying the failure."
        )

        confidence = 92

    # API failure
    elif incident_type == "api_failure":
        root_cause = (
            f"HTTP 500 errors indicate an internal application failure "
            f"in {affected_service or 'the API service'}."
        )

        impact = (
            "API requests may fail and prevent customers or internal "
            "services from accessing product data."
        )

        recommendation = (
            "Inspect application exceptions, review recent code changes, "
            "and verify the API service health."
        )

        confidence = 91

    # CPU spike
    elif incident_type == "cpu_spike":
        root_cause = (
            f"Abnormally high CPU utilization detected on "
            f"{affected_service or 'the affected service'}."
        )

        impact = (
            "High CPU utilization can increase request latency and "
            "eventually cause service instability."
        )

        recommendation = (
            "Inspect CPU-heavy processes, review traffic volume, "
            "and scale or optimize the affected workload."
        )

        confidence = 89

    # Memory leak
    elif incident_type == "memory_leak":
        root_cause = (
            f"Possible memory exhaustion or memory leak detected on "
            f"{affected_service or 'the affected service'}."
        )

        impact = (
            "Continued memory growth may cause application crashes "
            "or out-of-memory termination."
        )

        recommendation = (
            "Inspect memory usage over time, identify the leaking "
            "process, and restart or patch the affected service."
        )

        confidence = 90

    evidence = []

    for issue in log_analysis.get("issues", []):
        evidence.append({
            "type": issue.get("type"),
            "message": issue.get("message"),
        })

    if not evidence and logs.strip():
        evidence.append({
            "type": "log_evidence",
            "message": "Relevant production logs were provided for analysis.",
        })

    return {
        "status": "root_cause_identified",
        "incident_type": incident_type,
        "affected_service": affected_service,
        "root_cause": root_cause,
        "confidence": confidence,
        "impact": impact,
        "evidence": evidence,
        "recommendation": recommendation,
        "timestamp": datetime.utcnow().isoformat(),
    }