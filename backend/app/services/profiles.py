"""Read access to student profile rows via the Supabase service-role client.

The service role bypasses RLS, so every query here explicitly scopes by
user_id; callers only ever pass the authenticated user's id.
"""

from dataclasses import dataclass
from datetime import date
from functools import lru_cache

from supabase import Client, create_client

from app.config import get_settings


class ProfileStoreError(Exception):
    """Raised when the profile store cannot be reached."""


class ProfileNotFound(Exception):
    """Raised when the user has no profile or onboarding is incomplete."""


@dataclass(frozen=True)
class ProfileRecord:
    display_name: str
    education_level: str
    goal: str
    target_deadline: date | None
    study_days: list[str]
    study_minutes_per_day: int
    preferred_methods: list[str]
    current_step: int


@lru_cache
def get_admin_client() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise ProfileStoreError(
            "Supabase is not configured (set SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY, see backend/.env.example)."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def load_profile(user_id: str) -> tuple[ProfileRecord, list[str]]:
    """Return the user's completed profile and ordered subject names.

    Raises ProfileNotFound when the profile is missing or onboarding has not
    finished, and ProfileStoreError when the store is unreachable.
    """
    try:
        client = get_admin_client()
        profile_rows = (
            client.table("profiles")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
            .data
        )
        if not profile_rows:
            raise ProfileNotFound(user_id)

        row = profile_rows[0]
        if row.get("onboarding_completed_at") is None:
            raise ProfileNotFound(user_id)

        subject_rows = (
            client.table("subjects")
            .select("name")
            .eq("user_id", user_id)
            .order("name")
            .execute()
            .data
        )
    except ProfileNotFound:
        raise
    except Exception as exc:  # supabase-py raises APIError/TransportError variants
        raise ProfileStoreError(str(exc)) from exc

    deadline = row.get("target_deadline")
    study_minutes = row.get("study_minutes_per_day")
    profile = ProfileRecord(
        display_name=row["display_name"],
        education_level=row["education_level"],
        goal=row.get("goal") or "",
        target_deadline=date.fromisoformat(deadline) if deadline else None,
        study_days=list(row.get("study_days") or []),
        study_minutes_per_day=int(study_minutes) if study_minutes else 0,
        preferred_methods=list(row.get("preferred_methods") or []),
        current_step=int(row.get("current_step") or 1),
    )
    subject_names = [subject["name"] for subject in subject_rows]
    return profile, subject_names
