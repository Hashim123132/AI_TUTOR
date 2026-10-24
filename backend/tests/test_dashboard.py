from datetime import date, timedelta

import pytest

from app.auth import AuthUnavailable, TokenVerificationError
from app.config import get_settings
from app.services.dashboard import deadline_label
from app.services.profiles import ProfileNotFound, ProfileRecord, ProfileStoreError


def make_profile(**overrides) -> ProfileRecord:
    defaults = dict(
        display_name="Ada",
        education_level="undergraduate",
        goal="Pass the linear algebra final with confidence",
        target_deadline=date(2026, 12, 18),
        study_days=["monday", "wednesday", "friday"],
        study_minutes_per_day=45,
        preferred_methods=["reading", "quizzes"],
        current_step=6,
    )
    defaults.update(overrides)
    return ProfileRecord(**defaults)


def test_dashboard_requires_token(client):
    response = client.get("/api/dashboard")
    assert response.status_code == 401
    assert response.headers.get("www-authenticate") == "Bearer"


def test_dashboard_rejects_blank_bearer(client):
    response = client.get("/api/dashboard", headers={"Authorization": "Bearer "})
    assert response.status_code == 401


def test_dashboard_rejects_invalid_token(client, monkeypatch):
    def reject(token: str):
        raise TokenVerificationError(
            "Invalid or expired authentication token. Sign in again."
        )

    monkeypatch.setattr("app.auth.verify_access_token", reject)
    response = client.get(
        "/api/dashboard", headers={"Authorization": "Bearer bad-token"}
    )
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


def test_dashboard_503_when_auth_service_unreachable(client, monkeypatch):
    def unreachable(token: str):
        raise AuthUnavailable("Authentication service unreachable: connection refused")

    monkeypatch.setattr("app.auth.verify_access_token", unreachable)
    response = client.get(
        "/api/dashboard", headers={"Authorization": "Bearer any-token"}
    )
    assert response.status_code == 503
    assert "unreachable" in response.json()["detail"]


def test_dashboard_503_when_not_configured(client, supabase_unconfigured):
    response = client.get(
        "/api/dashboard", headers={"Authorization": "Bearer any-token"}
    )
    assert response.status_code == 503
    assert "SUPABASE_URL" in response.json()["detail"]


def test_dashboard_404_before_onboarding(client, auth_ok, auth_headers, monkeypatch):
    def raise_not_found(user_id: str):
        raise ProfileNotFound(user_id)

    monkeypatch.setattr("app.api.dashboard.load_profile", raise_not_found)
    response = client.get("/api/dashboard", headers=auth_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "onboarding_required"


def test_dashboard_503_when_store_unreachable(client, auth_ok, auth_headers, monkeypatch):
    def raise_store_error(user_id: str):
        raise ProfileStoreError("connection refused")

    monkeypatch.setattr("app.api.dashboard.load_profile", raise_store_error)
    response = client.get("/api/dashboard", headers=auth_headers)
    assert response.status_code == 503
    assert "Profile store unavailable" in response.json()["detail"]


def test_dashboard_returns_profile_data(client, auth_ok, auth_headers, monkeypatch):
    profile = make_profile()

    def fake_load(user_id: str):
        assert user_id == "00000000-0000-4000-8000-000000000001"
        return profile, ["Linear Algebra", "Numerical Methods"]

    monkeypatch.setattr("app.api.dashboard.load_profile", fake_load)
    response = client.get("/api/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["student"]["name"] == "Ada"
    assert data["student"]["goal"].startswith("Pass the linear algebra")
    assert data["student"]["examCountdownLabel"].startswith("Deadline in")
    assert data["summary"]["weeklyGoalMinutes"] == 45 * 3
    assert [s["subject"] for s in data["summary"]["subjects"]] == [
        "Linear Algebra",
        "Numerical Methods",
    ]
    assert all(s["masteryPercent"] == 0 for s in data["summary"]["subjects"])
    assert data["todayTasks"] == []
    assert data["upcomingTasks"] == []
    assert data["recentQuizzes"] == []
    assert len(data["week"]) == 7
    assert sum(1 for day in data["week"] if day["isToday"]) == 1
    assert {d["totalMinutes"] for d in data["week"]} <= {0, 45}


def test_dashboard_demo_mode_serves_sample_without_auth(client, demo_mode):
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    assert response.json()["student"]["name"] == "Amara"


def test_demo_mode_defaults_off():
    assert get_settings().dashboard_demo_mode is False


@pytest.mark.parametrize(
    ("days_offset", "expected"),
    [
        (-3, "Deadline passed"),
        (0, "Deadline today"),
        (1, "Deadline tomorrow"),
        (5, "Deadline in 5 days"),
        (21, "Deadline in 3 weeks"),
        (90, "Deadline in 3 months"),
        (400, "Deadline in 1 year"),
    ],
)
def test_deadline_label(days_offset, expected):
    today = date(2026, 10, 24)
    assert deadline_label(today + timedelta(days=days_offset), today=today) == expected


def test_deadline_label_without_date():
    assert deadline_label(None) == "No deadline set"
