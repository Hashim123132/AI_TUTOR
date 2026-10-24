"""Application settings loaded from environment variables and backend/.env."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _optional_str(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    dashboard_demo_mode: bool = False

    @field_validator(
        "supabase_url",
        "supabase_service_role_key",
        mode="before",
    )
    @classmethod
    def blank_means_unset(cls, value: object) -> object:
        if isinstance(value, str):
            return _optional_str(value)
        return value

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
