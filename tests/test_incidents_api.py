import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "checks" in data
    assert "database" in data["checks"]


def test_sentinel_metrics_endpoint():
    response = client.get("/sentinel-metrics")
    assert response.status_code == 200
    assert "sentinel_services_total" in response.text
    assert "sentinel_active_incidents_total" in response.text


def test_active_incidents_endpoint():
    response = client.get("/api/incidents/active")
    assert response.status_code == 200
    data = response.json()
    assert "active_incidents" in data
    assert "count" in data


def test_audit_endpoint():
    response = client.get("/api/incidents/audit")
    assert response.status_code == 200
    data = response.json()
    assert "audits" in data
    assert "count" in data


def test_decision_evaluate_endpoint():
    response = client.post(
        "/api/decision/evaluate",
        json={
            "service_name": "payment-service",
            "incident_type": "payment_failure",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["service_name"] == "payment-service"
    assert "selected_action" in data
    assert "candidate_matrix" in data
    assert len(data["candidate_matrix"]) == 4


def test_login_and_me_flow():
    # Login with seeded admin
    login_res = client.post(
        "/api/auth/login",
        json={
            "username": "admin",
            "password": "sentinel_admin_password_2026",
        },
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    token = token_data["access_token"]
    assert token_data["role"] == "admin"

    # Get /me
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "admin"


def test_register_flow():
    reg_res = client.post(
        "/api/auth/register",
        json={
            "username": "sre_tester_new",
            "email": "tester@sentinel.ai",
            "password": "ValidPassword123!",
            "role": "operator",
        },
    )
    assert reg_res.status_code in (201, 400)  # 201 if first time, 400 if already created
    if reg_res.status_code == 201:
        data = reg_res.json()
        assert data["username"] == "sre_tester_new"
        assert data["role"] == "operator"
