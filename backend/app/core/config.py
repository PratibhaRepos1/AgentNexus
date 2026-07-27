from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

# Anchored absolutely (not relative to cwd) so settings load correctly
# whether the app is started from the repo root, from backend/, or via
# Docker — pydantic-settings otherwise resolves env_file relative to the
# process's working directory, which silently falls back to these classes'
# defaults if that directory doesn't happen to contain a .env of its own.
_ROOT_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    app_name: str = "ChatBiz API"
    debug: bool = False

    database_url: str = "postgresql://chatbiz:chatbiz@localhost:5432/chatbiz"

    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10

    default_llm_provider: str = "groq"
    groq_api_key: str = ""
    gemini_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    resend_api_key: str = ""
    notification_from_email: str = "onboarding@resend.dev"

    embedding_model: str = "all-MiniLM-L6-v2"
    chunk_size: int = 600
    chunk_overlap: int = 50
    retrieval_top_k: int = 4

    # Plain str (not list[str]): pydantic-settings tries to JSON-decode
    # list-typed fields at the source level, before any validator runs,
    # which breaks the comma-separated format .env documents for this.
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = str(_ROOT_ENV_FILE)
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
