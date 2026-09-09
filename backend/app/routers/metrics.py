from fastapi import APIRouter
from datetime import datetime
import random

from backend.app.database import SessionLocal
from backend.app.models import Service

router = APIRouter(
    prefix="/api/metrics",
    tags=["Metrics"],
)


def get_active_incident():
    """
    Detect whether any service is currently degraded.
    The incident simulator changes service status in PostgreSQL,
    so metrics can react to the same system state.
    """
    db = SessionLocal()

    try:
        degraded_services = (
            db.query(Service)
            .filter(Service.status != "healthy")
            .all()
        )

        if not degraded_services:
            return None

        names = [service.name for service in degraded_services]

        # Infer the most likely incident from the affected service.
        if "payment-service" in names:
            return "payment_failure"

        if "order-service" in names:
            return "order_crash"

        if "inventory-service" in names:
            return "db_down"

        if "auth-service" in names:
            return "api_failure"

        return "api_failure"

    finally:
        db.close()


@router.get("/")
def get_metrics():

    incident = get_active_incident()

    # ---------------------------------------------------------
    # NORMAL PRODUCTION STATE
    # ---------------------------------------------------------

    if incident is None:

        cpu_usage = random.uniform(35, 55)
        memory_usage = random.uniform(42, 58)
        api_latency = random.uniform(90, 160)
        error_rate = random.uniform(0.1, 0.6)
        requests_per_minute = random.randint(1400, 2200)

    # ---------------------------------------------------------
    # DATABASE FAILURE
    # ---------------------------------------------------------

    elif incident == "db_down":

        cpu_usage = random.uniform(55, 75)
        memory_usage = random.uniform(55, 72)
        api_latency = random.uniform(700, 1800)
        error_rate = random.uniform(12, 28)
        requests_per_minute = random.randint(500, 1100)

    # ---------------------------------------------------------
    # PAYMENT FAILURE
    # ---------------------------------------------------------

    elif incident == "payment_failure":

        cpu_usage = random.uniform(45, 65)
        memory_usage = random.uniform(45, 65)
        api_latency = random.uniform(350, 900)
        error_rate = random.uniform(8, 18)
        requests_per_minute = random.randint(800, 1500)

    # ---------------------------------------------------------
    # ORDER SERVICE CRASH
    # ---------------------------------------------------------

    elif incident == "order_crash":

        cpu_usage = random.uniform(50, 70)
        memory_usage = random.uniform(50, 70)
        api_latency = random.uniform(400, 1000)
        error_rate = random.uniform(10, 22)
        requests_per_minute = random.randint(600, 1300)

    # ---------------------------------------------------------
    # API FAILURE
    # ---------------------------------------------------------

    elif incident == "api_failure":

        cpu_usage = random.uniform(60, 85)
        memory_usage = random.uniform(55, 75)
        api_latency = random.uniform(500, 1400)
        error_rate = random.uniform(15, 30)
        requests_per_minute = random.randint(400, 1200)

    # ---------------------------------------------------------
    # SAFETY FALLBACK
    # ---------------------------------------------------------

    else:

        cpu_usage = random.uniform(35, 55)
        memory_usage = random.uniform(42, 58)
        api_latency = random.uniform(90, 160)
        error_rate = random.uniform(0.1, 0.6)
        requests_per_minute = random.randint(1400, 2200)

    return {
        "cpu_usage": round(cpu_usage, 2),
        "memory_usage": round(memory_usage, 2),
        "api_latency": round(api_latency, 2),
        "error_rate": round(error_rate, 2),
        "requests_per_minute": requests_per_minute,
        "incident_active": incident is not None,
        "incident_type": incident,
        "timestamp": datetime.utcnow().isoformat(),
    }