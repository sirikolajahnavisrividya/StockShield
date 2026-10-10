from app.core.auth import get_current_user
from app.main import app


def test_health(client):
    r = client.get("/api/health"); assert r.status_code == 200 and r.json()["status"] == "ok"

def test_requires_auth():
    from fastapi.testclient import TestClient
    app.dependency_overrides.clear()
    assert TestClient(app).get("/api/stocks/AAPL/quote").status_code in (401, 503)

def test_invalid_symbol(client):
    assert client.get("/api/stocks/bad$sym/quote").status_code == 400

def test_invalid_period(client):
    assert client.get("/api/stocks/AAPL/history?period=10y").status_code == 422

def test_history_demo_is_labelled(client):
    d = client.get("/api/stocks/AAPL/history?period=1y").json()
    assert d["demo"] is True and len(d["points"]) > 200

def test_analysis_values_present(client):
    d = client.get("/api/stocks/AAPL/analysis?period=1y").json()
    assert d["annualised_volatility_pct"] > 0 and d["max_drawdown"]["value"] < 0
    assert any("DEMO" in w for w in d["warnings"])

def test_scenario_ok(client):
    r = client.post("/api/stocks/AAPL/scenario", json={"amount": 10000, "decline_pct": 15, "fractional": True})
    assert r.status_code == 200 and r.json()["result"]["final_value"] == 8500

def test_scenario_invalid_inputs(client):
    assert client.post("/api/stocks/AAPL/scenario", json={"amount": -5}).status_code == 422
    assert client.post("/api/stocks/AAPL/scenario", json={"amount": 100, "decline_pct": 150}).status_code == 422

def test_missing_api_key_is_honest(client, monkeypatch):
    monkeypatch.setenv("MARKET_DATA_PROVIDER", "alphavantage"); monkeypatch.setenv("MARKET_DATA_API_KEY", "")
    r = client.get("/api/stocks/AAPL/quote")
    assert r.status_code == 503 and "API key" in r.json()["error"]["message"]

def test_provider_rate_limit_and_malformed(client, monkeypatch):
    from app.services import market_data as md
    monkeypatch.setenv("MARKET_DATA_PROVIDER", "alphavantage"); monkeypatch.setenv("MARKET_DATA_API_KEY", "x")
    class R:
        status_code = 200; content = b"x"
        def __init__(s, j): s.j = j
        def json(s): return s.j
    monkeypatch.setattr(md.httpx, "get", lambda *a, **k: R({"Note": "limit"}))
    assert client.get("/api/stocks/AAPL/quote").status_code == 429
    md.clear_cache()
    monkeypatch.setattr(md.httpx, "get", lambda *a, **k: R({"Global Quote": {}}))
    assert client.get("/api/stocks/AAPL/quote").status_code == 404
    md.clear_cache()
    monkeypatch.setattr(md.httpx, "get", lambda *a, **k: R({"Error Message": "bad"}))
    assert client.get("/api/stocks/ZZZZ/quote").status_code == 404
