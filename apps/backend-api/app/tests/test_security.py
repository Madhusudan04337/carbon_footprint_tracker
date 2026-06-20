import pytest

def test_endpoint_requires_jwt_header(client):
    # Hit protected routes without authentication header
    response = client.get("/api/logs")
    assert response.status_code == 401
    assert "Not authenticated" in response.json()["detail"]

def test_cors_origin_headers(client):
    # Verify CORS policy settings allow authorized client origins
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization"
    }
    response = client.options("/api/logs", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"

def test_sql_injection_rejection_at_endpoint(client, token_headers):
    # Inject parameters to attempt queries escape
    malicious_payload = {
        "category": "transport",
        "sub_category": "car'; DROP TABLE ActivityLog;--",
        "value": 100.0,
        "date": "2026-06-20"
    }
    response = client.post("/api/logs", json=malicious_payload, headers=token_headers)
    
    # Either validation triggers 422 or parameters are successfully inserted as clean string values without query injection
    assert response.status_code in [400, 422, 201]
    if response.status_code == 201:
        log_id = response.json()["id"]
        check_res = client.get(f"/api/logs", headers=token_headers)
        logs = check_res.json()
        target_log = next(log for log in logs if log["id"] == log_id)
        assert target_log["sub_category"] == "car'; DROP TABLE ActivityLog;--"
