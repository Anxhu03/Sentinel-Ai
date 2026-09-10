import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# Load .env if present
load_dotenv(PROJECT_ROOT / ".env")


class Settings:
    PROJECT_NAME: str = "Sentinel AI"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("SENTINEL_ENV", "development")
    DEBUG: bool = os.getenv("SENTINEL_DEBUG", "false").lower() in ("true", "1", "yes")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://sentinel:sentinel_dev_password@localhost:5432/sentinel_db",
    )

    # Docker
    COMPOSE_DIR: str = os.getenv("SENTINEL_COMPOSE_DIR", str(PROJECT_ROOT))
    DOCKER_TIMEOUT: int = int(os.getenv("DOCKER_TIMEOUT", "30"))

    # Security & JWT
    SECRET_KEY: str = os.getenv(
        "SENTINEL_SECRET_KEY",
        "sentinel-production-grade-super-secret-key-999-ai-ops",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )

    # Safety Guardrails
    AUTO_REMEDIATION_ENABLED: bool = os.getenv(
        "AUTO_REMEDIATION_ENABLED", "true"
    ).lower() in ("true", "1", "yes")
    SAFETY_COOLDOWN_SECONDS: int = int(os.getenv("SAFETY_COOLDOWN_SECONDS", "20"))
    SAFETY_MAX_RESTARTS_PER_WINDOW: int = int(
        os.getenv("SAFETY_MAX_RESTARTS_PER_WINDOW", "3")
    )
    SAFETY_WINDOW_MINUTES: int = int(os.getenv("SAFETY_WINDOW_MINUTES", "10"))
    SAFETY_MAX_BLAST_RADIUS_AUTONOMOUS: int = int(
        os.getenv("SAFETY_MAX_BLAST_RADIUS_AUTONOMOUS", "3")
    )

    # CORS
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000",
        ).split(",")
        if origin.strip() and origin.strip() != "*"
    ]

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()
