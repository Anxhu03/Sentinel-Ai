from fastapi import FastAPI

app = FastAPI(title="Sentinel notification-service")

@app.get("/health")
def health():
    return {"service": "notification-service", "status": "healthy"}

@app.get("/")
def root():
    return {"service": "notification-service", "message": "notification-service online"}
