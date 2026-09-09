from fastapi import FastAPI

from backend.app.database import Base, engine
from backend.app import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sentinel AI",
    description="Enterprise AI Operations Copilot",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "message": "Sentinel AI is online",
        "status": "operational",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "sentinel-backend",
    }