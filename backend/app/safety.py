from datetime import datetime, timedelta, timezone
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.dependencies import get_dependents
from backend.app.models import RemediationAudit

ALLOWED_REMEDIATION_ACTIONS = {
    "restart_service",
    "rollback_deployment",
    "restart_dependency",
    "scale_service",
}

FORBIDDEN_DESTRUCTIVE_ACTIONS = {
    "drop_database",
    "purge_data",
    "kill_all",
    "delete_service",
    "format_volume",
}


class SafetyEvaluation(BaseModel):
    allowed: bool
    requires_manual_approval: bool = False
    policy_violations: List[str] = []
    reason: str
    cooldown_remaining_seconds: int = 0
    recent_actions_count: int = 0
    blast_radius_size: int = 0


def evaluate_remediation_safety(
    service_name: str,
    action: str,
    db: Session,
    operator: str = "autonomous_agent",
    force_override: bool = False,
) -> SafetyEvaluation:
    """
    Enterprise SRE Safety & Guardrail Evaluator.

    Enforces:
    1. Dangerous / destructive action veto
    2. Minimum cooldown window between actions on same target
    3. Rate limiting / thrashing prevention (max actions per time window)
    4. Blast-radius impact threshold (escalates to human operator if high impact)
    """
    violations: List[str] = []

    # 1. Destructive check
    if action in FORBIDDEN_DESTRUCTIVE_ACTIONS:
        return SafetyEvaluation(
            allowed=False,
            requires_manual_approval=True,
            policy_violations=["DESTRUCTIVE_ACTION_FORBIDDEN"],
            reason=f"Action '{action}' is strictly forbidden by Sentinel safety policy.",
        )

    if action not in ALLOWED_REMEDIATION_ACTIONS:
        return SafetyEvaluation(
            allowed=False,
            requires_manual_approval=True,
            policy_violations=["UNSUPPORTED_ACTION"],
            reason=f"Action '{action}' is not a recognized or permitted remediation action.",
        )

    now = datetime.now(timezone.utc)

    # 2. Check Cooldown
    latest_audit = (
        db.query(RemediationAudit)
        .filter(RemediationAudit.service == service_name)
        .order_by(RemediationAudit.created_at.desc())
        .first()
    )

    cooldown_remaining = 0
    if latest_audit and latest_audit.created_at:
        # Handle timezone awareness
        audit_time = latest_audit.created_at
        if audit_time.tzinfo is None:
            audit_time = audit_time.replace(tzinfo=timezone.utc)

        elapsed = (now - audit_time).total_seconds()
        if elapsed < settings.SAFETY_COOLDOWN_SECONDS:
            cooldown_remaining = int(settings.SAFETY_COOLDOWN_SECONDS - elapsed)
            violations.append(
                f"COOLDOWN_ACTIVE: Must wait {cooldown_remaining}s before executing another action on {service_name}."
            )

    # 3. Check Rate Limit / Thrashing
    window_start = now - timedelta(minutes=settings.SAFETY_WINDOW_MINUTES)
    recent_audits = (
        db.query(RemediationAudit)
        .filter(
            RemediationAudit.service == service_name,
            RemediationAudit.created_at >= window_start,
            RemediationAudit.execution_status != "blocked_by_safety_policy",
        )
        .all()
    )

    recent_count = len(recent_audits)
    if recent_count >= settings.SAFETY_MAX_RESTARTS_PER_WINDOW:
        violations.append(
            f"RATE_LIMIT_EXCEEDED: Service '{service_name}' reached {recent_count} actions in {settings.SAFETY_WINDOW_MINUTES}m (max: {settings.SAFETY_MAX_RESTARTS_PER_WINDOW}). Possible crash loop detected."
        )

    # 4. Check Blast Radius
    try:
        dependents = get_dependents(service_name)
        blast_radius_size = len(dependents)
    except Exception:
        blast_radius_size = 0

    requires_manual = False
    if blast_radius_size > settings.SAFETY_MAX_BLAST_RADIUS_AUTONOMOUS:
        requires_manual = True
        violations.append(
            f"HIGH_BLAST_RADIUS: Service affects {blast_radius_size} downstream services (threshold: {settings.SAFETY_MAX_BLAST_RADIUS_AUTONOMOUS}). Human operator confirmation required."
        )

    # Check override from admin
    if force_override and operator == "admin":
        return SafetyEvaluation(
            allowed=True,
            requires_manual_approval=False,
            policy_violations=violations,
            reason="Action permitted via Administrative Safety Override.",
            cooldown_remaining_seconds=0,
            recent_actions_count=recent_count,
            blast_radius_size=blast_radius_size,
        )

    # If any hard safety violations exist, block the action
    if violations:
        allowed = False
        reason = "; ".join(violations)
    else:
        allowed = True
        reason = "Safety checks passed successfully. Recovery action permitted."

    return SafetyEvaluation(
        allowed=allowed,
        requires_manual_approval=requires_manual,
        policy_violations=violations,
        reason=reason,
        cooldown_remaining_seconds=cooldown_remaining,
        recent_actions_count=recent_count,
        blast_radius_size=blast_radius_size,
    )
