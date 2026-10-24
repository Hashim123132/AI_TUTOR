"""Bearer-token authentication validated by Supabase GoTrue.

Tokens are introspected with GET /auth/v1/user instead of being decoded
locally, because Supabase issues both HS256 and ES256 access tokens
depending on project/CLI version. GoTrue validates whatever it signed, so
this works for local and hosted projects alike.
"""

from dataclasses import dataclass
from typing import Annotated

import httpx
from fastapi import Header, HTTPException

from app.config import get_settings


class TokenVerificationError(Exception):
    """GoTrue rejected the token (invalid, expired, or forged)."""


class AuthUnavailable(Exception):
    """Authentication could not be verified (not configured or unreachable)."""


@dataclass(frozen=True)
class CurrentUser:
    id: str


def verify_access_token(token: str) -> str:
    """Return the user id for a Supabase access token.

    Raises TokenVerificationError when GoTrue rejects the token and
    AuthUnavailable when verification cannot be attempted at all.
    """
    settings = get_settings()

    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise AuthUnavailable(
            "Server authentication is not configured. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY "
            "(see backend/.env.example)."
        )

    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/user"
    try:
        response = httpx.get(
            url,
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {token}",
            },
            timeout=5.0,
        )
    except httpx.HTTPError as exc:
        raise AuthUnavailable(f"Authentication service unreachable: {exc}") from exc

    if response.status_code in (401, 403):
        raise TokenVerificationError(
            "Invalid or expired authentication token. Sign in again."
        )
    if response.status_code != 200:
        raise AuthUnavailable(
            f"Authentication service returned status {response.status_code}."
        )

    user_id = response.json().get("id")
    if not user_id:
        raise TokenVerificationError("Invalid authentication token")
    return str(user_id)


def require_user(
    authorization: Annotated[str | None, Header()] = None,
) -> CurrentUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization[len("Bearer ") :].strip()
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = verify_access_token(token)
    except TokenVerificationError as exc:
        raise HTTPException(
            status_code=401,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except AuthUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return CurrentUser(id=user_id)
