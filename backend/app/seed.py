from backend.app.database import SessionLocal
from backend.app.models import Service


services = [
    {
        "name": "auth-service",
        "description": "Handles user authentication and authorization.",
    },
    {
        "name": "product-service",
        "description": "Manages product catalog and product information.",
    },
    {
        "name": "inventory-service",
        "description": "Tracks product inventory and stock levels.",
    },
    {
        "name": "payment-service",
        "description": "Processes customer payments and transactions.",
    },
    {
        "name": "order-service",
        "description": "Creates and manages customer orders.",
    },
    {
        "name": "shipping-service",
        "description": "Handles order shipping and delivery.",
    },
    {
        "name": "notification-service",
        "description": "Sends emails, alerts, and customer notifications.",
    },
]


db = SessionLocal()

try:
    for service_data in services:
        existing_service = (
            db.query(Service)
            .filter(Service.name == service_data["name"])
            .first()
        )

        if not existing_service:
            service = Service(**service_data)
            db.add(service)

    db.commit()
    print("All Sentinel services added successfully.")

finally:
    db.close()