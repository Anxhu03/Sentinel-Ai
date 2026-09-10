import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from backend.app.main import app

client = TestClient(app)


def test_password_hashing():
    raw = "super_secure_password_123"
    hashed = hash_password(raw)
    assert hashed != raw
    assert "$" in hashed
    assert verify_password(raw, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_jwt_token_flow():
    payload = {"sub": "test_operator", "role": "operator"}
    token = create_access_token(payload)
    assert isinstance(token, str)

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "test_operator"
    assert decoded["role"] == "operator"
    assert "exp" in decoded


def test_invalid_jwt_token():
    decoded = decode_access_token("gibberish.invalid.token")
    assert decoded is None


def test_signup_validation_and_creation():
    unique_suffix = uuid.uuid4().hex[:6]
    signup_payload = {
        "name": "Jane SRE",
        "email": f"jane_{unique_suffix}@sentinel.ai",
        "password": "SecurePassword2026!",
        "confirm_password": "SecurePassword2026!",
        "organization": "Acme Cloud",
        "workspace": "US-East-Cluster",
    }

    res = client.post("/api/auth/signup", json=signup_payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["email"] == signup_payload["email"]
    assert data["full_name"] == "Jane SRE"
    assert data["organization"] == "Acme Cloud"
    assert data["workspace"] == "US-East-Cluster"

    # Verify session works immediately with the issued token
    token = data["access_token"]
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == signup_payload["email"]
    assert me_data["organization"] == "Acme Cloud"


def test_signup_password_mismatch_rejected():
    unique_suffix = uuid.uuid4().hex[:6]
    res = client.post(
        "/api/auth/signup",
        json={
            "name": "Alex SRE",
            "email": f"alex_{unique_suffix}@sentinel.ai",
            "password": "PasswordOne123!",
            "confirm_password": "PasswordTwo456!",
        },
    )
    assert res.status_code == 400
    assert "match" in res.json()["detail"].lower()


def test_signup_short_password_rejected():
    unique_suffix = uuid.uuid4().hex[:6]
    res = client.post(
        "/api/auth/signup",
        json={
            "name": "Alex SRE",
            "email": f"short_{unique_suffix}@sentinel.ai",
            "password": "short",
            "confirm_password": "short",
        },
    )
    assert res.status_code == 400
    assert "8 characters" in res.json()["detail"].lower()


def test_signup_duplicate_email_rejected():
    unique_suffix = uuid.uuid4().hex[:6]
    signup_payload = {
        "name": "Dup Tester",
        "email": f"dup_{unique_suffix}@sentinel.ai",
        "password": "ValidPassword2026!",
        "confirm_password": "ValidPassword2026!",
    }
    # First signup
    res1 = client.post("/api/auth/signup", json=signup_payload)
    assert res1.status_code == 201

    # Second signup with same email
    res2 = client.post("/api/auth/signup", json=signup_payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_login_with_email_success():
    unique_suffix = uuid.uuid4().hex[:6]
    email = f"logintest_{unique_suffix}@sentinel.ai"
    password = "MySecurePassword2026!"

    # Create account
    client.post(
        "/api/auth/signup",
        json={
            "name": "Login Tester",
            "email": email,
            "password": password,
            "confirm_password": password,
        },
    )

    # Login using email
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["email"] == email


def test_login_invalid_credentials_rejected():
    res = client.post(
        "/api/auth/login",
        json={
            "email": "nonexistent_operator@nowhere.com",
            "password": "DefinitelyWrongPassword123!",
        },
    )
    assert res.status_code == 401
    assert "invalid email or password" in res.json()["detail"].lower()


def test_logout_endpoint():
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
