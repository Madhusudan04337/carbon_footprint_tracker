import pytest

def test_create_and_fetch_emissions_log(client, token_headers):
    # 1. Post a new activity log
    payload = {
        "category": "transport",
        "sub_category": "gasoline_car",
        "value": 150.0,
        "date": "2026-06-20"
    }
    
    response = client.post("/api/logs", json=payload, headers=token_headers)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["category"] == "transport"
    assert res_data["sub_category"] == "gasoline_car"
    assert res_data["emissions_co2e"] == 25.5  # 150 * 0.170
    assert "id" in res_data

    # 2. Get list of activity logs to verify retrieval
    get_response = client.get("/api/logs", headers=token_headers)
    assert get_response.status_code == 200
    logs_list = get_response.json()
    assert len(logs_list) >= 1
    assert any(log["id"] == res_data["id"] for log in logs_list)

def test_create_log_invalid_payload_fails(client, token_headers):
    # Invalid category and missing value
    payload = {
        "category": "invalid_category",
        "sub_category": "car",
        "date": "2026-06-20"
    }
    response = client.post("/api/logs", json=payload, headers=token_headers)
    assert response.status_code == 422  # Pydantic validation error

def test_create_log_negative_value_fails(client, token_headers):
    # Value must be positive (gt=0)
    payload = {
        "category": "transport",
        "sub_category": "car",
        "value": -10.0,
        "date": "2026-06-20"
    }
    response = client.post("/api/logs", json=payload, headers=token_headers)
    assert response.status_code == 422
