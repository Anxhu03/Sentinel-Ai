from fastapi import FastAPI

app = FastAPI(title="Sentinel order-service")

@app.get("/health")
def health():
    return {"service": "order-service", "status": "healthy"}

@app.get("/")
def root():
    return {"service": "order-service", "message": "order-service online"}
