from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Float,
    Text,
    DateTime,
    JSON,
)
from sqlalchemy.sql import func
from backend.app.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    status = Column(String, default="healthy", nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class ActiveIncident(Base):
    """Tracks live and historical active incidents with lifecycle state."""
    __tablename__ = "active_incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_type = Column(String, nullable=False, index=True)
    affected_service = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Lifecycle: 'active', 'investigating', 'mitigating', 'resolved'
    status = Column(String, default="active", nullable=False, index=True)

    # Severity: 'critical', 'elevated', 'normal'
    severity = Column(String, default="elevated", nullable=False)

    risk_score = Column(Float, default=50.0, nullable=False)
    confidence = Column(Float, default=0.85, nullable=False)
    root_cause = Column(Text, nullable=True)

    # Impacted service names as JSON array
    blast_radius = Column(JSON, default=list)

    # Telemetry and RCA evidence
    ai_analysis = Column(JSON, default=dict)
    logs_snippet = Column(Text, nullable=True)

    # Remediation linkage
    recommended_action = Column(String, nullable=True)
    actual_action = Column(String, nullable=True)
    resolved_by = Column(String, nullable=True)

    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)


class RemediationAudit(Base):
    """Immutable audit log for every remediation attempt and policy evaluation."""
    __tablename__ = "remediation_audits"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, nullable=True, index=True)
    service = Column(String, nullable=False, index=True)
    target = Column(String, nullable=False)
    action = Column(String, nullable=False)

    operator = Column(String, default="autonomous_agent", nullable=False)
    approved_by = Column(String, nullable=True)

    # 'success', 'failed', 'blocked_by_safety_policy'
    execution_status = Column(String, nullable=False, index=True)
    safety_allowed = Column(Boolean, default=True, nullable=False)
    policy_violations = Column(JSON, default=list)

    before_state = Column(JSON, default=dict)
    after_state = Column(JSON, default=dict)
    duration_seconds = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )


class User(Base):
    """Enterprise authentication & RBAC user model."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    # Extended multi-tenant profile
    full_name = Column(String(100), nullable=True)
    organization = Column(String(100), default="Sentinel Corp", nullable=False)
    workspace = Column(String(100), default="Production Mesh", nullable=False)

    # RBAC roles: 'admin', 'operator', 'viewer'
    role = Column(String(20), default="operator", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())