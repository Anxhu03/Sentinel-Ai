import pytest
from backend.app.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


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
