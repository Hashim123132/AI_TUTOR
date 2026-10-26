"""Groq generation through Groq's OpenAI-compatible API.

Uses the already-installed openai SDK pointed at Groq's base URL, so no extra
dependency is required. The API key stays on the backend (GROQ_API_KEY) and is
never sent to the browser.

The model id comes from GROQ_MODEL (default: a current Groq production model).
"""

from __future__ import annotations

import logging

import openai

from app.config import get_settings

logger = logging.getLogger(__name__)

GROQ_BASE_URL = "https://api.groq.com/openai/v1"

SYSTEM_PROMPT = (
    "You are a patient, friendly tutor helping a student study. "
    "Answer the student's question clearly, step by step, with concrete "
    "examples where useful. Use simple language. If you are unsure, say so "
    "honestly instead of guessing. Keep the answer focused."
)


class GroqError(Exception):
    """Base error for the Groq provider."""


class GroqNotConfigured(GroqError):
    """GROQ_API_KEY is missing on the server."""


class GroqTimeout(GroqError):
    """Groq did not answer within the configured timeout."""


class GroqRateLimited(GroqError):
    """Groq rejected the request due to rate limits."""


class GroqAuthError(GroqError):
    """Groq rejected the API key (invalid, revoked, or unauthorized model)."""


class GroqUnavailable(GroqError):
    """Groq is unreachable or returned an upstream error."""


def generate(prompt: str, max_new_tokens: int) -> str:
    """Return Groq's completion text for *prompt*.

    Raises the GroqError subclasses above; never falls back to another
    provider.
    """
    settings = get_settings()

    if not settings.groq_configured:
        raise GroqNotConfigured(
            "The Groq provider is not configured on the server."
        )

    # Clamp to the same generation safeguards as the custom model.
    max_new_tokens = max(1, min(max_new_tokens, 350))

    client = openai.OpenAI(
        api_key=settings.groq_api_key,
        base_url=GROQ_BASE_URL,
        timeout=settings.groq_timeout_seconds,
        max_retries=settings.groq_max_retries,
    )

    try:
        completion = client.chat.completions.create(
            model=settings.groq_model,
            max_tokens=max_new_tokens,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
    except openai.APITimeoutError as exc:
        logger.warning(
            "Groq timed out after %ss (model=%s)",
            settings.groq_timeout_seconds,
            settings.groq_model,
        )
        raise GroqTimeout("Groq took too long to respond.") from exc
    except openai.RateLimitError as exc:
        logger.warning("Groq rate limit hit (model=%s)", settings.groq_model)
        raise GroqRateLimited(
            "Groq is rate limiting requests right now. Try again shortly."
        ) from exc
    except (openai.AuthenticationError, openai.PermissionDeniedError) as exc:
        logger.error(
            "Groq rejected the credentials or model (model=%s)",
            settings.groq_model,
        )
        raise GroqAuthError(
            "The Groq provider rejected the server credentials."
        ) from exc
    except openai.APIConnectionError as exc:
        logger.exception("Could not reach Groq")
        raise GroqUnavailable("Groq could not be reached.") from exc
    except openai.APIStatusError as exc:
        logger.error("Groq returned status %s", exc.status_code)
        raise GroqUnavailable(
            f"Groq returned an error (status {exc.status_code})."
        ) from exc
    except openai.APIError as exc:
        logger.exception("Groq request failed")
        raise GroqUnavailable("Groq failed to generate a response.") from exc

    text = completion.choices[0].message.content if completion.choices else None
    if not isinstance(text, str) or not text.strip():
        raise GroqUnavailable("Groq returned an empty response.")

    return text
