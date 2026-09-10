import logging
import sys
from datetime import datetime, timezone
from backend.app.config import settings


class SentinelLogFormatter(logging.Formatter):
    """Clean structured log formatter with standard timestamps and contextual data."""

    def format(self, record):
        timestamp = datetime.now(timezone.utc).isoformat()
        record.timestamp = timestamp
        level = record.levelname
        msg = record.getMessage()
        module = record.module

        # Include extra attributes if available
        extra = ""
        if hasattr(record, "request_id"):
            extra += f" [req_id={record.request_id}]"
        if hasattr(record, "service"):
            extra += f" [service={record.service}]"

        return f"[{timestamp}] [{level:<7}] [{module}]{extra}: {msg}"


def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Avoid duplicate handlers
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(SentinelLogFormatter())
        root_logger.addHandler(handler)

    # Silence noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    return logging.getLogger("sentinel")


logger = setup_logging()
