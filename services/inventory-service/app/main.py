from fastapi import FastAPI

app = FastAPI(title="Sentinel inventory-service")

@app.get("/health")
def health():
    return {"service": "inventory-service", "status": "healthy"}

@app.get("/")
def root():
    return {"service": "inventory-service", "message": "inventory-service online"}
