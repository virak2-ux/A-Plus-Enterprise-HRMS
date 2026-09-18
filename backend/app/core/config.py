import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "A Plus Enterprise HRMS"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "1.0.0"

    # Security
    SECRET_KEY: str = "change-this-ultra-secure-cambodia-hrms-secret-key-in-production-3847284729"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    # Support PostgreSQL primary, with fallback SQLite if PostgreSQL server is not locally configured
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/cambodia_hrms"
    )
    SQLITE_FALLBACK_URL: str = (
        "sqlite:////tmp/cambodia_hrms.db"
        if os.getenv("VERCEL")
        else "sqlite:///./cambodia_hrms.db"
    )
    USE_SQLITE_FALLBACK: bool = True

    # Redis / Celery
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Localization & Currency Defaults
    TIMEZONE: str = "Asia/Phnom_Penh"
    DEFAULT_CURRENCY: str = "KHR"
    SECONDARY_CURRENCY: str = "USD"
    DEFAULT_LANGUAGE: str = "km"
    SUPPORTED_LANGUAGES: List[str] = ["km", "en"]

    # Storage (S3 / MinIO)
    S3_ENDPOINT: Optional[str] = os.getenv("S3_ENDPOINT", "http://localhost:9000")
    S3_ACCESS_KEY: Optional[str] = os.getenv("S3_ACCESS_KEY", "minioadmin")
    S3_SECRET_KEY: Optional[str] = os.getenv("S3_SECRET_KEY", "minioadmin")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "hrms-documents")
    S3_SECURE: bool = False

    # AI Integration Flag (Strict privacy default: OFF)
    AI_ENABLED: bool = False
    AI_PROVIDER: Optional[str] = None
    AI_API_KEY: Optional[str] = None
    AI_MODEL: Optional[str] = "gemini-2.5-pro"
    ALLOW_EMPLOYEE_DATA_TO_AI: bool = False
    ALLOW_SALARY_DATA_TO_AI: bool = False

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"


settings = Settings()
