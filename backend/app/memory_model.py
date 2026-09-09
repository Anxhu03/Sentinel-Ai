from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from sqlalchemy.sql import func

from backend.app.database import Base


class IncidentMemory(Base):
    __tablename__ = "incident_memory"

    id = Column(Integer, primary_key=True, index=True)

    incident_type = Column(String, nullable=False)
    affected_service = Column(String, nullable=False)

    root_cause = Column(Text, nullable=True)

    recovery_action = Column(String, nullable=True)

    recovery_success = Column(Boolean, default=False, nullable=False)

    recovery_time_seconds = Column(Float, nullable=True)

    confidence = Column(Float, nullable=True)

    risk_score = Column(Float, nullable=True)

    lesson = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
