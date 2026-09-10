import pytest
from backend.app.simulation import compare_actions, simulate_remediation


def test_simulate_remediation_restart():
    result = simulate_remediation(
        action="restart_service",
        service_name="payment-service",
        incident_type="payment_failure",
        base_risk_score=75,
    )
    assert result["action"] == "restart_service"
    assert result["simulated_recovery_probability"] > 0.5
    assert result["predicted_risk_reduction"] > 0
    assert result["estimated_recovery_seconds"] > 0


def test_compare_actions_returns_matrix():
    result = compare_actions(
        service_name="order-service",
        incident_type="order_crash",
    )
    assert "comparison" in result
    assert "optimal_action" in result
    actions = [item["action"] for item in result["comparison"]]
    assert "restart_service" in actions
    assert "rollback_deployment" in actions
    assert "scale_service" in actions
    assert result["optimal_action"]["action"] is not None
