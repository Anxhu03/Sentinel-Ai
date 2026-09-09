from fastapi import APIRouter

from backend.app.prediction import predict_incident
from backend.app.routers.metrics import get_metrics
from agents.log_agent import analyze_logs


router = APIRouter(
    prefix="/api/prediction",
    tags=["Prediction Engine"],
)


@router.get("/")
def get_prediction():
    """
    Generate Sentinel predictive intelligence using:

    - live infrastructure telemetry
    - recent log intelligence
    - active incident context
    """

    # ---------------------------------------------------------
    # LIVE TELEMETRY
    # ---------------------------------------------------------

    metrics = get_metrics()

    # ---------------------------------------------------------
    # LOG INTELLIGENCE
    # ---------------------------------------------------------
    #
    # For now we build a compact telemetry context for the
    # Log Agent. Later this can be replaced by real streaming
    # application logs.
    #

    telemetry_logs = (
        f"CPU utilization: {metrics['cpu_usage']} percent.\n"
        f"Memory utilization: {metrics['memory_usage']} percent.\n"
        f"API latency: {metrics['api_latency']} ms.\n"
        f"Error rate: {metrics['error_rate']} percent."
    )

    log_analysis = analyze_logs(telemetry_logs)

    log_signals = log_analysis.get("issues", [])

    # ---------------------------------------------------------
    # ACTIVE INCIDENT CONTEXT
    # ---------------------------------------------------------

    incident_active = metrics.get("incident_active", False)
    incident_type = metrics.get("incident_type")

    # ---------------------------------------------------------
    # PREDICTIVE ENGINE
    # ---------------------------------------------------------

    result = predict_incident(
        cpu_usage=metrics["cpu_usage"],
        memory_usage=metrics["memory_usage"],
        api_latency=metrics["api_latency"],
        error_rate=metrics["error_rate"],
        log_signals=log_signals,
        incident_active=incident_active,
        incident_type=incident_type,
    )

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    return {
        "engine": "Sentinel Predictive Engine",
        "status": "active",
        "metrics": metrics,
        "log_analysis": log_analysis,
        "prediction": result,
    }