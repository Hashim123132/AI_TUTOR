from pydantic import BaseModel, Field

MAX_NEW_TOKENS_DEFAULT = 200
MAX_NEW_TOKENS_LIMIT = 350


class GenerateRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=1,
        max_length=1024,
        description="Seed text for the model.",
    )
    max_new_tokens: int = Field(
        default=MAX_NEW_TOKENS_DEFAULT,
        ge=1,
        le=MAX_NEW_TOKENS_LIMIT,
    )


class GenerateResponse(BaseModel):
    prompt: str
    generated_text: str
    tokens_generated: int
    provider: str = Field(
        description=(
            "Provider that produced this answer: 'teacher_shneela' or 'groq'. "
            "Resolved server-side from the student's saved preference."
        ),
    )
