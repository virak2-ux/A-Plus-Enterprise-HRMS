from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token


def test_password_hashing():
    pwd = "SecureCambodiaHRMS2026!"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_generation_and_decoding():
    token = create_access_token(subject="user-123", extra_claims={"role": "SUPER_ADMIN"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["role"] == "SUPER_ADMIN"


def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin@cambodia-hrms.com", "password": "Admin@123456"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin@cambodia-hrms.com", "password": "WrongPassword!"}
    )
    assert response.status_code == 401


def test_get_current_user_me(client):
    # Login first
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin@cambodia-hrms.com", "password": "Admin@123456"}
    )
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["email"] == "admin@cambodia-hrms.com"
    assert data["data"]["is_superuser"] is True
