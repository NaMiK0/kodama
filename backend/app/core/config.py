from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Путь к .env в корне репозитория.
# Этот файл лежит по пути backend/app/core/config.py, поэтому:
#   parents[0] = core, parents[1] = app, parents[2] = backend, parents[3] = корень
ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",  # игнорировать посторонние переменные окружения
    )

    # ── PostgreSQL ──
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str = "localhost"
    postgres_port: int = 5432

    # ── JWT ──
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    @property
    def database_url(self) -> str:
        """URL подключения для SQLAlchemy. Драйвер psycopg (v3) — часть +psycopg."""
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
