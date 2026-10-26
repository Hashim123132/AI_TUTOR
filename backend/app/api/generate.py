"""POST /api/generate – provider-routed tutoring generation.

The student's AI provider is resolved server-side from their Supabase
profile using the Bearer token verified by GoTrue. The request body never
selects a provider, and a failing provider is never silently replaced.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException

from app.auth import require_user
from app.schemas.generate import GenerateRequest, GenerateResponse
from app.services import tutoring

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["generate"])


def _error_detail(
    exc: Exception,
    code: str,
    provider: tutoring.Provider | None = None,
) -> dict:
    detail: dict = {"code": code, "message": str(exc)}
    if provider is not None:
        detail["provider"] = provider
        detail["provider_label"] = tutoring.PROVIDER_LABELS[provider]
    return detail


@router.post(
    "/generate",
    response_model=GenerateResponse,
    summary="Generate a tutoring answer with the student's saved AI provider",
)
def post_generate(
    body: GenerateRequest,
    authorization: Annotated[str | None, Header()] = None,
) -> GenerateResponse:
    """Answer *prompt* using the provider the student chose in Settings.

    Requires a Supabase access token. Returns structured errors that name
    the provider so the chat UI can offer a retry or a switch in Settings;
    it never falls back to a different provider.
    """
    user = require_user(authorization)

    try:
        result = tutoring.generate_answer(
            user.id,
            body.prompt,
            body.max_new_tokens,
        )
    except tutoring.PreferenceStoreError as exc:
        logger.error("Could not read ai_provider for user %s", user.id)
        raise HTTPException(
            status_code=503,
            detail=_error_detail(
                exc,
                "preference_store_unavailable",
            ),
        ) from exc
    except tutoring.ProviderNotConfigured as exc:
        raise HTTPException(
            status_code=503,
            detail=_error_detail(exc, "provider_not_configured", exc.provider),
        ) from exc
    except tutoring.ProviderTimeout as exc:
        raise HTTPException(
            status_code=504,
            detail=_error_detail(exc, "provider_timeout", exc.provider),
        ) from exc
    except tutoring.ProviderRateLimited as exc:
        raise HTTPException(
            status_code=429,
            detail=_error_detail(exc, "provider_rate_limited", exc.provider),
        ) from exc
    except tutoring.ProviderAuthError as exc:
        raise HTTPException(
            status_code=503,
            detail=_error_detail(exc, "provider_misconfigured", exc.provider),
        ) from exc
    except tutoring.ProviderError as exc:
        logger.exception(
            "Provider %s failed for user %s", exc.provider, user.id
        )
        raise HTTPException(
            status_code=502,
            detail=_error_detail(exc, "provider_error", exc.provider),
        ) from exc

    return GenerateResponse(
        prompt=body.prompt,
        generated_text=result.generated_text,
        tokens_generated=result.tokens_generated,
        provider=result.provider,
    )
