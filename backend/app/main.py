from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.database import Base, engine

from backend.app.routers import services
from backend.app.routers import incidents
from backend.app.routers import ai
from backend.app.routers import metrics
from backend.app.routers import dependencies
from backend.app.routers import impact
from backend.app.routers import simulation
from backend.app.routers import memory
from backend.app.routers import prediction

from backend.app import models
from backend.app import memory_model


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Sentinel AI",
    description="Enterprise AI Operations Copilot",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(services.router)
app.include_router(incidents.router)
app.include_router(ai.router)
app.include_router(metrics.router)
app.include_router(dependencies.router)
app.include_router(impact.router)
app.include_router(simulation.router)
app.include_router(memory.router)
app.include_router(prediction.router)


@app.get("/")
def root():
    return {
        "name": "Sentinel AI",
        "status": "online",
        "description": "Enterprise AI Operations Copilot",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "sentinel-ai",
    }