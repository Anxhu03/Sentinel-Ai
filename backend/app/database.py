from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import settings

from typing import Any, Dict

import os
from pathlib import Path
from backend.app.logging_config import logger

def get_engine():
    db_url = settings.DATABASE_URL.strip()
    is_serverless = bool(
        os.getenv("VERCEL")
        or os.getenv("VERCEL_ENV")
        or os.getenv("AWS_LAMBDA_FUNCTION_NAME")
        or os.getenv("LAMBDA_TASK_ROOT")
    )

    # Determine safe SQLite path (use /tmp on serverless or if local dir is read-only)
    sqlite_path = "/tmp/sentinel.db" if is_serverless else str(Path(__file__).resolve().parent.parent.parent / "sentinel.db")
    if not is_serverless:
        try:
            test_file = Path(sqlite_path).parent / ".perm_check"
            test_file.touch()
            test_file.unlink()
        except Exception:
            sqlite_path = "/tmp/sentinel.db"

    # If running on Vercel/serverless and DATABASE_URL is default localhost postgres, fall back to SQLite immediately
    if is_serverless and ("localhost" in db_url or "127.0.0.1" in db_url):
        db_url = f"sqlite:///{sqlite_path}"
        logger.info(f"Serverless environment detected: using SQLite at {db_url}")

    engine_kwargs: Dict[str, Any] = {"pool_pre_ping": True}
    if "sqlite" in db_url:
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    else:
        engine_kwargs.update({"pool_size": 5, "max_overflow": 10, "connect_args": {"connect_timeout": 3}})

    try:
        eng = create_engine(db_url, **engine_kwargs)
        with eng.connect() as conn:
            pass
        return eng
    except Exception as exc:
        logger.warning(f"Could not connect to database at {db_url} ({exc}). Falling back to SQLite at {sqlite_path}.")
        fallback_url = f"sqlite:///{sqlite_path}"
        return create_engine(fallback_url, pool_pre_ping=True, connect_args={"check_same_thread": False})

engine = get_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()