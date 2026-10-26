"""Teacher Shneela generation via the Hugging Face Space.

The custom Nosheen_Hina character-level transformer (app/ml/model.py) is
served by a Gradio Space; this module is the API client for it. The call
pattern (queue POST -> event_id -> SSE GET) is the one previously used by
POST /api/generate, extracted so both providers share one tutoring service.

The Space owns the model checkpoint, so the backend never needs the .pt file.
"""

from __future__ import annotations

import json
import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

GRADIO_QUEUE_PATH = "/gradio_api/call/generate_text"


class TeacherShneelaError(Exception):
    """Base error for the Teacher Shneela provider."""


class TeacherShneelaTimeout(TeacherShneelaError):
    """The Space did not answer within the configured timeout."""


class TeacherShneelaUnavailable(TeacherShneelaError):
    """The Space is unreachable, misbehaving, or returned an error."""


def generate(prompt: str, max_new_tokens: int) -> str:
    """Continue *prompt* with the Teacher Shneela model.

    Returns the full output string (prompt + generated continuation),
    matching the historical /api/generate contract.

    Raises TeacherShneelaTimeout and TeacherShneelaUnavailable.
    """
    settings = get_settings()
    space_url = settings.teacher_shneela_space_url.rstrip("/")
    timeout = settings.teacher_shneela_timeout_seconds

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                f"{space_url}{GRADIO_QUEUE_PATH}",
                json={"data": [prompt, max_new_tokens]},
            )
            response.raise_for_status()
            event_id = response.json()["event_id"]

            response = client.get(
                f"{space_url}{GRADIO_QUEUE_PATH}/{event_id}"
            )
            response.raise_for_status()

            result = None
            for line in response.iter_lines():
                if not line.startswith("data:"):
                    continue

                payload = json.loads(line[5:].strip())

                if isinstance(payload, dict) and payload.get("error"):
                    raise TeacherShneelaUnavailable(str(payload["error"]))

                if isinstance(payload, list) and payload:
                    result = payload[0]
                elif isinstance(payload, str):
                    result = payload

    except httpx.TimeoutException as exc:
        logger.warning("Teacher Shneela Space timed out after %ss", timeout)
        raise TeacherShneelaTimeout(
            "The Teacher Shneela model took too long to respond."
        ) from exc
    except httpx.HTTPError as exc:
        logger.exception("Teacher Shneela Space request failed")
        raise TeacherShneelaUnavailable(
            "The Teacher Shneela model could not be reached."
        ) from exc
    except (KeyError, ValueError) as exc:
        logger.exception("Teacher Shneela Space returned an invalid payload")
        raise TeacherShneelaUnavailable(
            "The Teacher Shneela model returned an invalid response."
        ) from exc

    if not isinstance(result, str):
        raise TeacherShneelaUnavailable(
            "The Teacher Shneela model returned an invalid response."
        )

    return result
