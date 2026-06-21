import hashlib

def generate_safe_password(email: str) -> str:
    return "Pass-" + hashlib.sha256(email.encode()).hexdigest()[:12] + "!"

def test_user_registration_and_login(client):
    test_email = "test_qa@ecotrace.org"
    test_password = generate_safe_password(test_email)
    
    # 1. Register a new user
    register_payload = {
        "email": test_email,
        "password": test_password,
        "first_name": "Test",
        "last_name": "QA",
        "country": "US",
        "postal_code": "90210"
    }
    
    reg_response = client.post("/api/auth/register", json=register_payload)
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert reg_data["email"] == test_email
    assert "id" in reg_data

    # 2. Login with registered credentials
    login_payload = {
        "email": test_email,
        "password": test_password
    }
    
    login_response = client.post("/api/auth/login", json=login_payload)
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    assert login_data["token_type"] == "bearer"

def test_login_invalid_credentials_fail(client):
    login_payload = {
        "email": "nonexistent@ecotrace.org",
        "password": "wrongpassword"
    }
    
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 401
    assert "credentials" in response.json()["error"].lower()


