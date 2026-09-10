import pytest
from backend.app.database import SessionLocal
from backend.app.decision import evaluate_decision


def test_evaluate_decision_returns_bundle():
    db = SessionLocal()
    try:
        decision = evaluate_decision(
            service_name="payment-service",
            incident_type="payment_failure",
            db=db,
            root_cause="Payment gateway timeout",
        )
        assert decision.service_name == "payment-service"
        assert decision.selected_action in (
            "restart_service",
            "rollback_deployment",
            "scale_service",
            "restart_dependency",
        )
        assert decision.confidence > 50.0
        assert len(decision.candidate_matrix) == 4
        assert len(decision.rationale) > 0
    finally:
        db.close()


def test_evaluate_decision_cpu_spike_favors_scaling():
    db = SessionLocal()
    try:
        decision = evaluate_decision(
            service_name="order-service",
            incident_type="cpu_spike",
            db=db,
        )
        # cpu_spike has affinity for scale_service
        assert decision.selected_action == "scale_service"
    finally:
        db.close()
