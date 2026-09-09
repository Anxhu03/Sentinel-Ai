from fastapi import APIRouter
from pydantic import BaseModel

from agents.log_agent import analyze_logs


router = APIRouter(
    prefix="/api/ai",
    tags=["AI Investigation"],
)


class LogAnalysisRequest(BaseModel):
    logs: str


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