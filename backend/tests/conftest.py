import os

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings

TEST_USER_ID = "00000000-0000-4000-8000-000000000001"

os.environ.setdefault("DASHBOARD_DEMO_MODE", "false")
get_settings.cache_clear()


@pytest.fixture
def client() -> TestClient:
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
    get_settings.cache_clear()


@pytest.fixture
def auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer test-token"}


@pytest.fixture
def auth_ok(monkeypatch):
    """Pretend GoTrue accepts any bearer token as TEST_USER_ID."""
    monkeypatch.setattr("app.auth.verify_access_token", lambda token: TEST_USER_ID)


@pytest.fixture
def demo_mode(monkeypatch):
    monkeypatch.setenv("DASHBOARD_DEMO_MODE", "true")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def supabase_unconfigured(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
