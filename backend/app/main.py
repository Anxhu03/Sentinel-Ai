from fastapi import FastAPI

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