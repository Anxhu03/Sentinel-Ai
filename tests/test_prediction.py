import pytest
from backend.app.prediction import predict_incident


def test_predict_incident_normal_telemetry():
    result = predict_incident(
        cpu_usage=40.0,
        memory_usage=45.0,
        api_latency=120.0,
        error_rate=0.2,
        log_signals=[],
        incident_active=False,
    )
    assert result["risk_score"] < 40.0
    assert result["risk_level"] in ("Low", "Normal")
    assert result["incident_imminent"] is False


def test_predict_incident_critical_telemetry():
    result = predict_incident(
        cpu_usage=95.0,
        memory_usage=92.0,
        api_latency=1600.0,
        error_rate=15.0,
        log_signals=["Fatal error detected in upstream payment provider."],
        incident_active=True,
        incident_type="payment_failure",
    )
    assert result["risk_score"] >= 70.0
    assert result["risk_level"] in ("Critical", "High")
    assert len(result["signals"]) > 0


def test_predict_incident_cpu_spike():
    result = predict_incident(
        cpu_usage=96.0,
        memory_usage=50.0,
        api_latency=200.0,
        error_rate=1.0,
        incident_type="cpu_spike",
    )
    assert any("CPU" in signal for signal in result["signals"])
    assert result["risk_score"] >= 30.0
