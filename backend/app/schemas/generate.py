"""Pydantic schemas for the /api/generate endpoint."""

from pydantic import BaseModel, Field

from app.ml.model import MAX_NEW_TOKENS_DEFAULT, MAX_NEW_TOKENS_LIMIT


class GenerateRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=1,
        max_length=1024,
        description="Seed text for the model. Unknown characters are skipped.",
        examples=["the artificial intelligence"],
    )
    max_new_tokens: int = Field(
        default=MAX_NEW_TOKENS_DEFAULT,
        ge=1,
        le=MAX_NEW_TOKENS_LIMIT,
        description=(
            f"Number of characters to generate (1–{MAX_NEW_TOKENS_LIMIT}). "
            f"Defaults to {MAX_NEW_TOKENS_DEFAULT}."
        ),
    )


class GenerateResponse(BaseModel):
    prompt: str = Field(description="The original prompt echoed back.")
    generated_text: str = Field(
        description="Full output (prompt + model continuation)."
    )
    tokens_generated: int = Field(
        description="Number of new characters appended by the model."
    )

    model_config = {"json_schema_extra": {"examples": [
        {
            "prompt": "the artificial intelligence",
            "generated_text": (
                "the artificial intelligence between theoretical developments …"
            ),
            "tokens_generated": 200,
        }
    ]}}
