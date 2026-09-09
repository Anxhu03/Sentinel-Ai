from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.simulation import compare_actions

router = APIRouter(
    prefix="/api/simulation",
    tags=["What-If Simulation"],
)


class SimulationRequest(BaseModel):
    service_name: str
    incident_type: str = "unknown"


@router.post("/compare")
def compare_simulation(request: SimulationRequest):
    return compare_actions(
        service_name=request.service_name,
        incident_type=request.incident_type,
    )
