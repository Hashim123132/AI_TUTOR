"""RLS verification: one user must never read or modify another user's rows.

Exercises the real access path (PostgREST with per-user JWTs) plus the
backend dashboard endpoint. Skipped when Supabase is unreachable.
"""

import httpx
import pytest

from app.config import get_settings
from tests.test_dashboard_integration import (
    create_user,
    delete_user,
    insert_completed_profile,
    rest_headers,
)

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


def rest_url(path: str) -> str:
    return f"{settings.supabase_url.rstrip('/')}/rest/v1/{path}"


def test_user_cannot_read_another_users_profile():
    user_a = create_user()
    user_b = create_user()
    try:
        insert_completed_profile(user_a, "Private Student")

        visible = httpx.get(
            rest_url("profiles"),
            params={"select": "display_name", "user_id": f"eq.{user_a.id}"},
            headers=rest_headers(user_b.access_token),
            timeout=10.0,
        )
        assert visible.status_code == 200
        assert visible.json() == []

        subjects = httpx.get(
            rest_url("subjects"),
            params={"user_id": f"eq.{user_a.id}"},
            headers=rest_headers(user_b.access_token),
            timeout=10.0,
        )
        assert subjects.status_code == 200
        assert subjects.json() == []
    finally:
        delete_user(user_a.id)
        delete_user(user_b.id)


def test_user_cannot_update_another_users_profile():
    user_a = create_user()
    user_b = create_user()
    try:
        insert_completed_profile(user_a, "Private Student")

        updated = httpx.patch(
            rest_url("profiles"),
            params={"user_id": f"eq.{user_a.id}"},
            headers=rest_headers(user_b.access_token)
            | {"Prefer": "return=representation"},
            json={"display_name": "HACKED"},
            timeout=10.0,
        )
        assert updated.status_code == 200
        assert updated.json() == []

        unchanged = httpx.get(
            rest_url("profiles"),
            params={"select": "display_name", "user_id": f"eq.{user_a.id}"},
            headers=rest_headers(user_a.access_token),
            timeout=10.0,
        )
        assert unchanged.json() == [{"display_name": "Private Student"}]
    finally:
        delete_user(user_a.id)
        delete_user(user_b.id)


def test_user_cannot_insert_profile_for_another_user():
    user_a = create_user()
    user_b = create_user()
    try:
        response = httpx.post(
            rest_url("profiles"),
            headers=rest_headers(user_b.access_token),
            json={
                "user_id": user_a.id,
                "display_name": "Impostor",
                "education_level": "graduate",
            },
            timeout=10.0,
        )
        assert response.status_code in (400, 403)
    finally:
        delete_user(user_a.id)
        delete_user(user_b.id)


def test_user_cannot_delete_another_users_profile():
    user_a = create_user()
    user_b = create_user()
    try:
        insert_completed_profile(user_a, "Private Student")

        deleted = httpx.delete(
            rest_url("profiles"),
            params={"user_id": f"eq.{user_a.id}"},
            headers=rest_headers(user_b.access_token)
            | {"Prefer": "return=representation"},
            timeout=10.0,
        )
        assert deleted.status_code == 200
        assert deleted.json() == []

        still_there = httpx.get(
            rest_url("profiles"),
            params={"select": "display_name", "user_id": f"eq.{user_a.id}"},
            headers=rest_headers(user_a.access_token),
            timeout=10.0,
        )
        assert still_there.json() == [{"display_name": "Private Student"}]
    finally:
        delete_user(user_a.id)
        delete_user(user_b.id)
