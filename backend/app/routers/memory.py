from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal
from backend.app.memory_model import IncidentMemory


router = APIRouter(
    prefix="/api/memory",
    tags=["Incident Memory"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


class IncidentMemoryCreate(BaseModel):
    incident_type: str
    affected_service: str
    root_cause: Optional[str] = None
    recovery_action: Optional[str] = None
    recovery_success: bool = False
    recovery_time_seconds: Optional[float] = None
    confidence: Optional[float] = None
    risk_score: Optional[float] = None
    lesson: Optional[str] = None


def memory_to_dict(memory: IncidentMemory):
    return {
        "id": memory.id,
        "incident_type": memory.incident_type,
        "affected_service": memory.affected_service,
        "root_cause": memory.root_cause,
        "recovery_action": memory.recovery_action,
        "recovery_success": memory.recovery_success,
        "recovery_time_seconds": memory.recovery_time_seconds,
        "confidence": memory.confidence,
        "risk_score": memory.risk_score,
        "lesson": memory.lesson,
        "created_at": (
            memory.created_at.isoformat()
            if memory.created_at
            else None
        ),
    }


@router.post("/")
def create_incident_memory(
    incident: IncidentMemoryCreate,
    db: Session = Depends(get_db),
):
    memory = IncidentMemory(
        incident_type=incident.incident_type,
        affected_service=incident.affected_service,
        root_cause=incident.root_cause,
        recovery_action=incident.recovery_action,
        recovery_success=incident.recovery_success,
        recovery_time_seconds=incident.recovery_time_seconds,
        confidence=incident.confidence,
        risk_score=incident.risk_score,
        lesson=incident.lesson,
    )

    db.add(memory)
    db.commit()
    db.refresh(memory)

    return {
        "status": "memory_stored",
        "memory": memory_to_dict(memory),
    }


@router.get("/")
def get_incident_memories(
    incident_type: Optional[str] = Query(default=None),
    affected_service: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(IncidentMemory)

    if incident_type:
        query = query.filter(
            IncidentMemory.incident_type == incident_type
        )

    if affected_service:
        query = query.filter(
            IncidentMemory.affected_service == affected_service
        )

    memories = (
        query
        .order_by(IncidentMemory.created_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "status": "memory_retrieved",
        "count": len(memories),
        "filters": {
            "incident_type": incident_type,
            "affected_service": affected_service,
        },
        "memories": [
            memory_to_dict(memory)
            for memory in memories
        ],
    }


@router.get("/similar")
def find_similar_incidents(
    incident_type: Optional[str] = None,
    affected_service: Optional[str] = None,
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    query = db.query(IncidentMemory)

    if incident_type:
        query = query.filter(
            IncidentMemory.incident_type == incident_type
        )

    if affected_service:
        query = query.filter(
            IncidentMemory.affected_service == affected_service
        )

    memories = (
        query
        .order_by(
            IncidentMemory.recovery_success.desc(),
            IncidentMemory.created_at.desc(),
        )
        .limit(limit)
        .all()
    )

    return {
        "status": "similar_incidents_found",
        "count": len(memories),
        "memories": [
            memory_to_dict(memory)
            for memory in memories
        ],
    }