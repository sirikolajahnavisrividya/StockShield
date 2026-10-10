import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import User, get_current_user
from app.services import market_data


@pytest.fixture
def client(monkeypatch):
    market_data.clear_cache()
    monkeypatch.setenv("MARKET_DATA_PROVIDER", "demo")
    app.dependency_overrides[get_current_user] = lambda: User(id="u1", email="a@b.c", token="t")
    yield TestClient(app)
    app.dependency_overrides.clear()
