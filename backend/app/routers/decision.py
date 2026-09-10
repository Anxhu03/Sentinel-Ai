from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database import get_db
from backend.app.decision import evaluate_decision
from backend.app.loop import execute_sentinel_loop

router = APIRouter(
    prefix="/api/decision",
    tags=["AI Decision Engine & Closed Loop"],
)


class EvaluateDecisionRequest(BaseModel):
    service_name: str
    incident_type: str
    root_cause: Optional[str] = None
    operator: Optional[str] = "autonomous_agent"


class RunLoopRequest(BaseModel):
    service_name: str
    incident_type: str
    operator: Optional[str] = "sentinel_closed_loop"
    auto_act: bool = True


@router.post("/evaluate")
def evaluate_decision_endpoint(
    request: EvaluateDecisionRequest,
    db: Session = Depends(get_db),
):
    """
    Run the unified decision engine to evaluate candidate remediation actions,
    integrate simulation outcomes, query memory weights, and enforce safety guardrails.
    """
    decision = evaluate_decision(
        service_name=request.service_name,
        incident_type=request.incident_type,
        db=db,
        root_cause=request.root_cause,
        operator=request.operator or "autonomous_agent",
    )
    return decision


@router.post("/run-loop")
def run_closed_loop_endpoint(
    request: RunLoopRequest,
    db: Session = Depends(get_db),
):
    """
    Trigger the end-to-end 8-stage SRE intelligence loop:
    Observe → Understand → Predict → Simulate → Decide → Act → Verify → Learn.
    """
    result = execute_sentinel_loop(
        service_name=request.service_name,
        incident_type=request.incident_type,
        db=db,
        operator=request.operator or "sentinel_closed_loop",
        auto_act=request.auto_act,
    )
    return result
