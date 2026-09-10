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

    # ── Cookie-авторизация ──
    auth_cookie_name: str = "kodama_access_token"
    # На localhost по http кука с флагом secure не поставится — включаем на проде
    auth_cookie_secure: bool = False

    # ── CORS ──
    # Через запятую. Список задаём строкой, а не list[str]: так значение
    # читается из .env как есть, без обязательного JSON-синтаксиса.
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # ── LLM / OpenRouter ──
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    # Через запятую, по приоритету: первая модель — основная, дальше — фолбек
    # на случай 429/недоступности (бесплатные модели на OpenRouter то и дело
    # либо теряют :free-статус, либо временно перегружены у апстрим-провайдера).
    llm_models: str = "nvidia/nemotron-3.5-lightning:free,nvidia/nemotron-3-super-120b-a12b:free,google/gemma-4-31b-it:free"

    @property
    def llm_model_list(self) -> list[str]:
        return [model.strip() for model in self.llm_models.split(",") if model.strip()]

    # ── RabbitMQ ──
    rabbitmq_user: str
    rabbitmq_password: str
    rabbitmq_host: str = "localhost"
    rabbitmq_port: int = 5672

    # ── SMTP (email) ──
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    email_backend: str = "console"

    # ── Password reset ──
    reset_token_expire_minutes: int = 60
    frontend_base_url: str = "http://localhost:5173"

    # ── Google OAuth ──
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    # ── Redis ──
    redis_host: str = "localhost"
    redis_port: int = 6379

    # ── Проверка произношения ──
    # stub — заглушка без ML (отладка пайплайна), real — настоящие модели
    pronunciation_backend: str = "stub"
    whisper_model: str = "small"
    upload_dir: str = "uploads"

    @property
    def rabbitmq_url(self) -> str:
        return (
            f"amqp://{self.rabbitmq_user}:{self.rabbitmq_password}"
            f"@{self.rabbitmq_host}:{self.rabbitmq_port}/"
        )

    @property
    def database_url(self) -> str:
        """URL подключения для SQLAlchemy. Драйвер psycopg (v3) — часть +psycopg."""
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
