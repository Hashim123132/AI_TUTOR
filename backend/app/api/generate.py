import json
import logging

import httpx
from fastapi import APIRouter, HTTPException

from app.schemas.generate import GenerateRequest, GenerateResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["generate"])

SPACE_URL = "https://hashimumar-nosheen-hina.hf.space"
TIMEOUT = 300.0


@router.post(
    "/generate",
    response_model=GenerateResponse,
    summary="Generate text from a prompt",
)
def post_generate(body: GenerateRequest) -> GenerateResponse:
    try:
        with httpx.Client(timeout=TIMEOUT) as client:
            response = client.post(
                f"{SPACE_URL}/gradio_api/call/generate_text",
                json={"data": [body.prompt, body.max_new_tokens]},
            )
            response.raise_for_status()
            event_id = response.json()["event_id"]

            response = client.get(
                f"{SPACE_URL}/gradio_api/call/generate_text/{event_id}"
            )
            response.raise_for_status()

            result = None
            for line in response.iter_lines():
                if not line.startswith("data:"):
                    continue

                payload = json.loads(line[5:].strip())

                if isinstance(payload, dict) and payload.get("error"):
                    raise RuntimeError(str(payload["error"]))

                if isinstance(payload, list) and payload:
                    result = payload[0]
                elif isinstance(payload, str):
                    result = payload

            if not isinstance(result, str):
                raise RuntimeError("The model returned an invalid response.")

            full_text = result

    except (httpx.HTTPError, KeyError, ValueError, RuntimeError) as exc:
        logger.exception("Hugging Face generation failed")
        raise HTTPException(
            status_code=503,
            detail="The generation model is temporarily unavailable.",
        ) from exc

    return GenerateResponse(
        prompt=body.prompt,
        generated_text=full_text,
        tokens_generated=max(0, len(full_text) - len(body.prompt)),
    )
