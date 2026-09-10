import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text

from backend.app.config import settings
from backend.app.database import Base, SessionLocal, engine
from backend.app.logging_config import logger
from backend.app.models import ActiveIncident, Service, User
from backend.app.routers import (
    ai,
    auth,
    decision,
    dependencies,
    impact,
    incidents,
    memory,
    metrics,
    prediction,
    services,
    simulation,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown lifecycle."""
    logger.info("Initializing Sentinel AI Operations Engine...")

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Safe dynamic column migration for existing user tables
    try:
        with engine.connect() as conn:
            for col, col_type in [
                ("full_name", "VARCHAR(100)"),
                ("organization", "VARCHAR(100) DEFAULT 'Sentinel Corp'"),
                ("workspace", "VARCHAR(100) DEFAULT 'Production Mesh'"),
            ]:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                    conn.commit()
                except Exception:
                    pass
    except Exception as exc:
        logger.debug(f"Column migration note: {exc}")

    # Seed default services and users if missing
    db = SessionLocal()
    try:
        # Seed services if empty
        if db.query(Service).count() == 0:
            default_services = [
                "auth-service",
                "product-service",
                "inventory-service",
                "payment-service",
                "order-service",
                "shipping-service",
                "notification-service",
            ]
            for svc_name in default_services:
                db.add(Service(name=svc_name, status="healthy", is_active=True))
            db.commit()
            logger.info(f"Seeded {len(default_services)} microservices into database.")

        # Seed initial admin user if empty
        if db.query(User).count() == 0:
            from backend.app.auth import hash_password
            admin = User(
                username="admin",
                email="admin@sentinel.ai",
                hashed_password=hash_password("sentinel_admin_password_2026"),
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            logger.info("Seeded default admin user: 'admin'")

    except Exception as exc:
        logger.warning(f"Startup initialization note: {exc}")
    finally:
        db.close()

    yield
    logger.info("Shutting down Sentinel AI Operations Engine.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Autonomous Enterprise AI Operations & SRE Resilience Platform",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?:\/\/.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers: Guarantee strict JSON responses for all error conditions
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code,
            "status": "error",
        },
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = "; ".join(
        [f"{e.get('loc', ['field'])[-1]}: {e.get('msg', 'invalid')}" for e in errors]
    )
    return JSONResponse(
        status_code=422,
        content={
            "detail": msg or "Validation error",
            "errors": errors,
            "status": "error",
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(
        f"Unhandled server error at {request.method} {request.url.path}: {exc}"
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please try again later.",
            "status": "error",
        },
    )


# Request Logging & Correlation ID Middleware
@app.middleware("http")
async def request_timing_and_correlation_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start_time = time.time()

    response: Response = await call_next(request)

    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"

    if request.url.path not in ("/health", "/metrics", "/favicon.ico"):
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} ({process_time * 1000:.1f}ms)",
            extra={"request_id": request_id},
        )

    return response


# Include Routers
app.include_router(services.router)
app.include_router(incidents.router)
app.include_router(ai.router)
app.include_router(metrics.router)
app.include_router(dependencies.router)
app.include_router(impact.router)
app.include_router(simulation.router)
app.include_router(memory.router)
app.include_router(prediction.router)
app.include_router(auth.router)
app.include_router(decision.router)


@app.get("/", tags=["System"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "online",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "description": "Autonomous Enterprise AI Operations & SRE Resilience Platform",
        "docs": "/docs",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health", tags=["System"])
def health():
    """Production-grade health check testing database, docker, and active incidents."""
    db_healthy = False
    services_count = 0
    active_incidents = 0

    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
        services_count = db.query(Service).count()
        active_incidents = (
            db.query(ActiveIncident)
            .filter(ActiveIncident.status != "resolved")
            .count()
        )
    except Exception as exc:
        logger.error(f"Health check database error: {exc}")
    finally:
        db.close()

    status_str = "healthy" if db_healthy else "degraded"

    return {
        "status": status_str,
        "service": "sentinel-ai-backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {
            "database": "connected" if db_healthy else "disconnected",
            "active_incidents": active_incidents,
            "registered_services": services_count,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/sentinel-metrics", tags=["System"])
def sentinel_prometheus_metrics():
    """Prometheus-compatible plain text metrics for Sentinel itself."""
    db = SessionLocal()
    try:
        total_services = db.query(Service).count()
        healthy_services = db.query(Service).filter(Service.status == "healthy").count()
        active_incidents = (
            db.query(ActiveIncident)
            .filter(ActiveIncident.status != "resolved")
            .count()
        )
    except Exception:
        total_services = 0
        healthy_services = 0
        active_incidents = 0
    finally:
        db.close()

    metrics_text = f"""# HELP sentinel_services_total Total registered microservices
# TYPE sentinel_services_total gauge
sentinel_services_total {total_services}

# HELP sentinel_services_healthy Healthy microservices
# TYPE sentinel_services_healthy gauge
sentinel_services_healthy {healthy_services}

# HELP sentinel_active_incidents_total Number of currently active unresolved incidents
# TYPE sentinel_active_incidents_total gauge
sentinel_active_incidents_total {active_incidents}

# HELP sentinel_system_up System operational status
# TYPE sentinel_system_up gauge
sentinel_system_up 1
"""
    return Response(content=metrics_text, media_type="text/plain")