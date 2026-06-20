import pytest
import time

def test_endpoint_latency_sla(client, token_headers):
    """
    SLA: Retrieving user logs should respond in less than 200ms in testing environments.
    """
    start_time = time.perf_counter()
    response = client.get("/api/logs", headers=token_headers)
    latency_ms = (time.perf_counter() - start_time) * 1000

    assert response.status_code == 200
    assert latency_ms < 200.0, f"Dashboard retrieval API slow: {latency_ms:.1f}ms"

def test_analytics_calculation_latency_sla(client, token_headers):
    """
    SLA: Retrieving summary analytics dashboard data should respond in less than 300ms.
    """
    start_time = time.perf_counter()
    response = client.get("/api/analytics/summary", headers=token_headers)
    latency_ms = (time.perf_counter() - start_time) * 1000

    assert response.status_code == 200
    assert latency_ms < 300.0, f"Analytics summary SLA exceeded: {latency_ms:.1f}ms"
