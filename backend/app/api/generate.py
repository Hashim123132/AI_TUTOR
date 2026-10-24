"""POST /api/generate – character-level text generation via Nosheen_Hina."""

import logging

from fastapi import APIRouter, HTTPException

from app.ml.model import generate
from app.schemas.generate import GenerateRequest, GenerateResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["generate"])


@router.post(
    "/generate",
    response_model=GenerateResponse,
    summary="Generate text from a prompt",
    description=(
        "Runs the Nosheen_Hina character-level transformer with the given seed "
        "text and returns a continuation.  "
        "**Note:** this is a character-level language model trained on educational "
        "text — it produces fluent-sounding continuations but is not a "
        "question-answering system and may generate inaccurate content."
    ),
)
def post_generate(body: GenerateRequest) -> GenerateResponse:
    """Accept a student prompt and return generated text."""
    try:
        full_text = generate(body.prompt, max_new_tokens=body.max_new_tokens)
    except ValueError as exc:
        # All characters in the prompt are outside the model vocabulary
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        # Checkpoint failed to load
        logger.error("Model runtime error: %s", exc)
        raise HTTPException(
            status_code=503,
            detail=(
                "The generation model is not available. "
                "Ensure the checkpoint file is present on the server."
            ),
        ) from exc

    tokens_generated = len(full_text) - len(body.prompt)
    return GenerateResponse(
        prompt=body.prompt,
        generated_text=full_text,
        tokens_generated=tokens_generated,
    )
