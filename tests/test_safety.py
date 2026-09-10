import pytest
from datetime import datetime, timedelta, timezone
from backend.app.database import SessionLocal
from backend.app.models import RemediationAudit
from backend.app.safety import evaluate_remediation_safety


def test_safety_rejects_destructive_actions():
    db = SessionLocal()
    try:
        eval_result = evaluate_remediation_safety(
            service_name="payment-service",
            action="drop_database",
            db=db,
        )
        assert eval_result.allowed is False
        assert "DESTRUCTIVE_ACTION_FORBIDDEN" in eval_result.policy_violations
    finally:
        db.close()


def test_safety_rejects_unsupported_actions():
    db = SessionLocal()
    try:
        eval_result = evaluate_remediation_safety(
            service_name="payment-service",
            action="arbitrary_unsupported_hack",
            db=db,
        )
        assert eval_result.allowed is False
        assert "UNSUPPORTED_ACTION" in eval_result.policy_violations
    finally:
        db.close()


def test_safety_allows_valid_action():
    db = SessionLocal()
    try:
        eval_result = evaluate_remediation_safety(
            service_name="test-sandbox-service-unique",
            action="restart_service",
            db=db,
        )
        assert eval_result.allowed is True
        assert len(eval_result.policy_violations) == 0
    finally:
        db.close()


def test_safety_detects_cooldown():
    db = SessionLocal()
    try:
        # Insert a fake recent audit
        test_service = "test-cooldown-service"
        audit = RemediationAudit(
            service=test_service,
            target=test_service,
            action="restart_service",
            operator="test",
            execution_status="success",
            created_at=datetime.now(timezone.utc),
        )
        db.add(audit)
        db.commit()

        eval_result = evaluate_remediation_safety(
            service_name=test_service,
            action="restart_service",
            db=db,
        )
        assert eval_result.allowed is False
        assert any("COOLDOWN_ACTIVE" in v for v in eval_result.policy_violations)

        # Cleanup
        db.delete(audit)
        db.commit()
    finally:
        db.close()
