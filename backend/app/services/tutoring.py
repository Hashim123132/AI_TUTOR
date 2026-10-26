"""Shared tutoring-generation service.

Resolves the signed-in student's saved AI provider from Supabase and routes
the generation request to exactly one provider:

- ``teacher_shneela`` -> the custom Nosheen_Hina PyTorch model served by the
  Hugging Face Space (app/services/teacher_shneela.py)
- ``groq``            -> the hosted Groq API (app/services/groq_provider.py)

The provider is always read server-side from the database using the
authenticated user's id (verified by GoTrue) — never from request bodies —
and failures never fall back to a different provider. Students are told what
happened and can retry or switch in Settings.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Literal

from app.services import groq_provider, teacher_shneela
from app.services.profiles import get_admin_client

logger = logging.getLogger(__name__)

Provider = Literal["teacher_shneela", "groq"]

DEFAULT_PROVIDER: Provider = "teacher_shneela"
ALLOWED_PROVIDERS: tuple[Provider, ...] = ("teacher_shneela", "groq")

PROVIDER_LABELS: dict[Provider, str] = {
    "teacher_shneela": "Teacher Shneela",
    "groq": "Groq",
}


class PreferenceStoreError(Exception):
    """The provider preference could not be read from Supabase."""


class ProviderNotConfigured(Exception):
    """The selected provider lacks server-side configuration."""

    def __init__(self, provider: Provider, message: str) -> None:
        super().__init__(message)
        self.provider = provider


class ProviderTimeout(Exception):
    """The selected provider did not answer in time."""

    def __init__(self, provider: Provider, message: str) -> None:
        super().__init__(message)
        self.provider = provider


class ProviderRateLimited(Exception):
    """The selected provider is rate limiting the student."""

    def __init__(self, provider: Provider, message: str) -> None:
        super().__init__(message)
        self.provider = provider


class ProviderAuthError(Exception):
    """The selected provider rejected the server credentials."""

    def __init__(self, provider: Provider, message: str) -> None:
        super().__init__(message)
        self.provider = provider


class ProviderError(Exception):
    """The selected provider failed to generate an answer."""

    def __init__(self, provider: Provider, message: str) -> None:
        super().__init__(message)
        self.provider = provider


@dataclass(frozen=True)
class TutoringResult:
    generated_text: str
    provider: Provider
    tokens_generated: int


def normalize_provider(value: object) -> Provider:
    """Return a known provider for *value*, else the default."""
    if value in ALLOWED_PROVIDERS:
        return value  # type: ignore[return-value]
    return DEFAULT_PROVIDER


def resolve_provider(user_id: str) -> Provider:
    """Return the student's saved provider (default: Teacher Shneela).

    Missing profiles rows, nulls, and unexpected values all resolve to the
    default so chat keeps working; only store failures raise.
    """
    try:
        client = get_admin_client()
        rows = (
            client.table("profiles")
            .select("ai_provider")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
            .data
        )
    except Exception as exc:  # supabase-py raises APIError/TransportError variants
        raise PreferenceStoreError(str(exc)) from exc

    if not rows:
        return DEFAULT_PROVIDER

    raw = rows[0].get("ai_provider")
    provider = normalize_provider(raw)
    if raw is not None and provider != raw:
        logger.warning(
            "Unknown ai_provider %r for user %s; using %s",
            raw,
            user_id,
            provider,
        )
    return provider


def generate_answer(
    user_id: str,
    prompt: str,
    max_new_tokens: int,
) -> TutoringResult:
    """Generate an answer for *user_id* using their saved provider.

    Raises the typed provider errors above; never silently switches provider.
    """
    provider = resolve_provider(user_id)

    try:
        if provider == "groq":
            # Groq returns the completion text only.
            text = groq_provider.generate(prompt, max_new_tokens)
            new_text_length = len(text)
        else:
            # Teacher Shneela returns prompt + continuation (historical
            # contract of POST /api/generate).
            text = teacher_shneela.generate(prompt, max_new_tokens)
            new_text_length = max(0, len(text) - len(prompt))
    except groq_provider.GroqNotConfigured as exc:
        raise ProviderNotConfigured(provider, str(exc)) from exc
    except groq_provider.GroqTimeout as exc:
        raise ProviderTimeout(provider, str(exc)) from exc
    except groq_provider.GroqRateLimited as exc:
        raise ProviderRateLimited(provider, str(exc)) from exc
    except groq_provider.GroqAuthError as exc:
        raise ProviderAuthError(provider, str(exc)) from exc
    except groq_provider.GroqError as exc:
        raise ProviderError(provider, str(exc)) from exc
    except teacher_shneela.TeacherShneelaTimeout as exc:
        raise ProviderTimeout(provider, str(exc)) from exc
    except teacher_shneela.TeacherShneelaError as exc:
        raise ProviderError(provider, str(exc)) from exc

    return TutoringResult(
        generated_text=text,
        provider=provider,
        tokens_generated=new_text_length,
    )
