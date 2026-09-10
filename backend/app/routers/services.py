from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import SessionLocal
from backend.app.models import Service


router = APIRouter(
    prefix="/api/services",
    tags=["Services"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("")
@router.get("/")
def get_services(db: Session = Depends(get_db)):
    services = db.query(Service).all()

    return [
        {
            "id": service.id,
            "name": service.name,
            "status": service.status,
            "description": service.description,
            "is_active": service.is_active,
        }
        for service in services
    ]