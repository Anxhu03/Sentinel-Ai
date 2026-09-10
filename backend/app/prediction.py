def predict_incident(
    cpu_usage,
    memory_usage,
    api_latency,
    error_rate,
    log_signals=None,
    incident_active=False,
    incident_type=None,
):
    """
    Sentinel Predictive Intelligence Engine.

    Combines:
    - infrastructure telemetry
    - log-derived signals
    - active incident context

    Produces a deterministic and explainable prediction.
    """

    signals = []
    risk_score = 0

    log_signals = log_signals or []

    # -----------------------------
    # CPU ANALYSIS
    # -----------------------------

    if cpu_usage >= 90:
        risk_score += 35
        signals.append(
            "CPU utilization is critically high and approaching saturation."
        )
    elif cpu_usage >= 85:
        risk_score += 30
        signals.append(
            "CPU utilization is approaching saturation."
        )
    elif cpu_usage >= 70:
        risk_score += 15
        signals.append(
            "CPU utilization is elevated."
        )

    # -----------------------------
    # MEMORY ANALYSIS
    # -----------------------------

    if memory_usage >= 90:
        risk_score += 35
        signals.append(
            "Memory utilization is critically high."
        )
    elif memory_usage >= 85:
        risk_score += 30
        signals.append(
            "Memory utilization is approaching critical levels."
        )
    elif memory_usage >= 70:
        risk_score += 15
        signals.append(
            "Memory utilization is elevated."
        )

    # -----------------------------
    # API LATENCY ANALYSIS
    # -----------------------------

    if api_latency >= 1500:
        risk_score += 30
        signals.append(
            "API latency is critically high."
        )
    elif api_latency >= 1000:
        risk_score += 25
        signals.append(
            "API latency is severely degraded."
        )
    elif api_latency >= 400:
        risk_score += 12
        signals.append(
            "API latency is increasing."
        )

    # -----------------------------
    # ERROR RATE ANALYSIS
    # -----------------------------

    if error_rate >= 10:
        risk_score += 30
        signals.append(
            "Application error rate is critically high."
        )
    elif error_rate >= 5:
        risk_score += 20
        signals.append(
            "Application error rate is significantly elevated."
        )
    elif error_rate >= 3:
        risk_score += 12
        signals.append(
            "Application error rate is elevated."
        )

    # -----------------------------
    # LOG SIGNAL ANALYSIS
    # -----------------------------

    normalized_log_signals = []

    for signal in log_signals:
        if isinstance(signal, dict):
            signal_type = signal.get("type", "")
            message = signal.get("message", "")

            normalized_log_signals.append(
                f"{signal_type} {message}".lower()
            )
        else:
            normalized_log_signals.append(
                str(signal).lower()
            )

    log_text = " ".join(normalized_log_signals)

    if "cpu_issue" in log_text:
        risk_score += 15
        signals.append(
            "Log Agent detected abnormal CPU pressure."
        )

    if "memory_issue" in log_text:
        risk_score += 15
        signals.append(
            "Log Agent detected memory pressure or possible memory exhaustion."
        )

    if "worker_queue_pressure" in log_text:
        risk_score += 10
        signals.append(
            "Worker queue pressure indicates increasing workload stress."
        )

    if "timeout" in log_text:
        risk_score += 10
        signals.append(
            "Log Agent detected timeout or elevated latency conditions."
        )

    if "api_error" in log_text:
        risk_score += 15
        signals.append(
            "Log Agent detected HTTP/API errors."
        )

    if "database_failure" in log_text:
        risk_score += 20
        signals.append(
            "Log Agent detected database connectivity risk."
        )

    if "redis_failure" in log_text:
        risk_score += 15
        signals.append(
            "Log Agent detected Redis/cache connectivity risk."
        )

    if "network_failure" in log_text:
        risk_score += 15
        signals.append(
            "Log Agent detected network connectivity risk."
        )

    if "service_failure" in log_text:
        risk_score += 20
        signals.append(
            "Log Agent detected service availability failure."
        )

    if "deployment_failure" in log_text:
        risk_score += 20
        signals.append(
            "Log Agent detected a deployment or release failure."
        )

    if "disk_failure" in log_text:
        risk_score += 15
        signals.append(
            "Log Agent detected disk or storage pressure."
        )

    # -----------------------------
    # ACTIVE INCIDENT CONTEXT
    # -----------------------------

    if incident_active:
        risk_score += 20

        if incident_type:
            signals.append(
                f"Active incident context detected: {incident_type}."
            )
        else:
            signals.append(
                "An active production incident is currently being investigated."
            )

    # Prevent score from exceeding 100
    risk_score = min(risk_score, 100)

    # -----------------------------
    # WARNING & RISK LEVEL
    # -----------------------------

    if risk_score >= 70:
        warning_level = "critical"
        risk_level = "Critical"
    elif risk_score >= 40:
        warning_level = "elevated"
        risk_level = "High"
    elif risk_score >= 20:
        warning_level = "normal"
        risk_level = "Normal"
    else:
        warning_level = "normal"
        risk_level = "Low"

    incident_imminent = bool(risk_score >= 70 or incident_active)

    # -----------------------------
    # PREDICTED INCIDENT
    # -----------------------------

    if (
        "database_failure" in log_text
        or incident_type == "db_down"
    ):
        predicted_incident = "database_failure"

    elif (
        "service_failure" in log_text
        or incident_type == "order_crash"
        or incident_type == "api_failure"
    ):
        predicted_incident = "service_failure"

    elif (
        "deployment_failure" in log_text
        or incident_type == "deployment_bug"
    ):
        predicted_incident = "deployment_failure"

    elif (
        "network_failure" in log_text
        or incident_type == "network_failure"
    ):
        predicted_incident = "network_failure"

    elif (
        api_latency >= 400
        and error_rate >= 3
    ):
        predicted_incident = "api_degradation"

    elif (
        cpu_usage >= 70
        or "cpu_issue" in log_text
    ):
        predicted_incident = "cpu_saturation"

    elif (
        memory_usage >= 70
        or "memory_issue" in log_text
    ):
        predicted_incident = "memory_exhaustion"

    elif "redis_failure" in log_text:
        predicted_incident = "redis_failure"

    elif "disk_failure" in log_text:
        predicted_incident = "disk_exhaustion"

    else:
        predicted_incident = "no_immediate_failure"

    # -----------------------------
    # CONFIDENCE
    # -----------------------------

    confidence = min(
        95,
        max(
            55,
            55
            + risk_score // 2
            + min(len(signals) * 2, 10),
        ),
    )

    # -----------------------------
    # RECOMMENDATION
    # -----------------------------

    if risk_score >= 70:

        recommendation = (
            "Immediate investigation recommended. "
            "Multiple production signals indicate a high probability "
            "of service degradation or failure."
        )

    elif risk_score >= 40:

        recommendation = (
            "Increase monitoring and investigate the abnormal telemetry "
            "and log signals before the condition escalates."
        )

    elif risk_score > 0:

        recommendation = (
            "Monitor the detected signals and investigate emerging "
            "infrastructure pressure."
        )

    else:

        recommendation = (
            "Continue monitoring. No immediate preventive intervention "
            "is required."
        )

    return {
        "risk_score": risk_score,
        "warning_level": warning_level,
        "risk_level": risk_level,
        "incident_imminent": incident_imminent,
        "predicted_incident": predicted_incident,
        "confidence": confidence,
        "signals": signals,
        "recommendation": recommendation,
    }