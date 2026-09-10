from fastapi import APIRouter
from pydantic import BaseModel

from agents.log_agent import analyze_logs
from agents.orchestrator.orchestrator import investigate_incident


router = APIRouter(
    prefix="/api/ai",
    tags=["AI Investigation"],
)


class LogAnalysisRequest(BaseModel):
    logs: str


class InvestigationRequest(BaseModel):
    incident_type: str
    affected_service: str | None = None
    logs: str = ""


@router.post("/analyze-logs")
def analyze_logs_endpoint(request: LogAnalysisRequest):
    """
    Send application logs to Sentinel's Log Agent
    and return the detected issues.
    """

    result = analyze_logs(request.logs)

    return {
        "agent": "log_agent",
        "result": result,
    }


@router.post("/investigate")
def investigate_incident_endpoint(request: InvestigationRequest):
    """
    Run a complete Sentinel AI investigation.

    Pipeline:
        Incident
            ↓
        Log Agent
            ↓
        RCA Agent
            ↓
        Unified Investigation
    """

    result = investigate_incident(
        incident_type=request.incident_type,
        affected_service=request.affected_service,
        logs=request.logs,
    )

    return {
        "agent": "sentinel_core",
        "result": result,
    }