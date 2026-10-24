"""Dashboard endpoint tests against a live local Supabase stack.

Skipped automatically when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are unset
or the stack is not reachable.
"""

import uuid
from types import SimpleNamespace

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings

settings = get_settings()


def _supabase_reachable() -> bool:
    if not (settings.supabase_url and settings.supabase_service_role_key):
        return False
    try:
        response = httpx.get(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/health",
            headers={"apikey": settings.supabase_service_role_key},
            timeout=3.0,
        )
        return response.status_code == 200
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    not _supabase_reachable(),
    reason="Supabase not reachable; set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
)


def create_user() -> SimpleNamespace:
    base = settings.supabase_url.rstrip("/")
    service = settings.supabase_service_role_key
    email = f"tutor-test-{uuid.uuid4().hex[:12]}@example.com"
    password = "test-password-12345"

    created = httpx.post(
        f"{base}/auth/v1/admin/users",
        headers={
            "apikey": service,
            "Authorization": f"Bearer {service}",
            "Content-Type": "application/json",
        },
        json={"email": email, "password": password, "email_confirm": True},
        timeout=10.0,
    )
    created.raise_for_status()

    token_response = httpx.post(
        f"{base}/auth/v1/token?grant_type=password",
        headers={"apikey": service, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=10.0,
    )
    token_response.raise_for_status()

    return SimpleNamespace(
        id=created.json()["id"],
        email=email,
        access_token=token_response.json()["access_token"],
    )


def delete_user(user_id: str) -> None:
    base = settings.supabase_url.rstrip("/")
    service = settings.supabase_service_role_key
    httpx.delete(
        f"{base}/auth/v1/admin/users/{user_id}",
        headers={"apikey": service, "Authorization": f"Bearer {service}"},
        timeout=10.0,
    )


def rest_headers(access_token: str) -> dict[str, str]:
    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


def insert_completed_profile(user: SimpleNamespace, display_name: str) -> None:
    base = settings.supabase_url.rstrip("/")
    response = httpx.post(
        f"{base}/rest/v1/profiles",
        headers=rest_headers(user.access_token) | {"Prefer": "return=representation"},
        json={
            "user_id": user.id,
            "display_name": display_name,
            "education_level": "undergraduate",
            "goal": "Finish the semester strong with a steady study routine",
            "target_deadline": "2026-12-18",
            "study_days": ["monday", "wednesday", "friday"],
            "study_minutes_per_day": 45,
            "preferred_methods": ["reading", "quizzes"],
            "current_step": 6,
            "onboarding_completed_at": "2026-10-24T00:00:00+00:00",
        },
        timeout=10.0,
    )
    response.raise_for_status()

    subjects = httpx.post(
        f"{base}/rest/v1/subjects",
        headers=rest_headers(user.access_token),
        json=[
            {"user_id": user.id, "name": "Linear Algebra", "knowledge_level": "intermediate"},
            {"user_id": user.id, "name": "Numerical Methods", "knowledge_level": "beginner"},
        ],
        timeout=10.0,
    )
    subjects.raise_for_status()


def test_dashboard_404_without_profile(client):
    user = create_user()
    try:
        response = client.get(
            "/api/dashboard", headers={"Authorization": f"Bearer {user.access_token}"}
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "onboarding_required"
    finally:
        delete_user(user.id)


def test_dashboard_returns_own_profile_data(client):
    user = create_user()
    try:
        insert_completed_profile(user, "Live Test Student")
        response = client.get(
            "/api/dashboard", headers={"Authorization": f"Bearer {user.access_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["student"]["name"] == "Live Test Student"
        assert data["summary"]["weeklyGoalMinutes"] == 135
        assert [s["subject"] for s in data["summary"]["subjects"]] == [
            "Linear Algebra",
            "Numerical Methods",
        ]
        assert data["todayTasks"] == []
        assert len(data["week"]) == 7
    finally:
        delete_user(user.id)


def test_dashboard_rejects_forged_token(client):
    user = create_user()
    try:
        forged = user.access_token[:-4] + "AAAA"
        response = client.get(
            "/api/dashboard", headers={"Authorization": f"Bearer {forged}"}
        )
        assert response.status_code == 401
    finally:
        delete_user(user.id)


def test_dashboard_separates_two_users(client):
    user_a = create_user()
    user_b = create_user()
    try:
        insert_completed_profile(user_a, "Student A")
        insert_completed_profile(user_b, "Student B")

        response_a = client.get(
            "/api/dashboard", headers={"Authorization": f"Bearer {user_a.access_token}"}
        )
        response_b = client.get(
            "/api/dashboard", headers={"Authorization": f"Bearer {user_b.access_token}"}
        )
        assert response_a.status_code == 200
        assert response_b.status_code == 200
        assert response_a.json()["student"]["name"] == "Student A"
        assert response_b.json()["student"]["name"] == "Student B"
    finally:
        delete_user(user_a.id)
        delete_user(user_b.id)
