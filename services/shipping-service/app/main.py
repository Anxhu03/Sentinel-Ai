from fastapi import FastAPI

app = FastAPI(title="Sentinel shipping-service")

@app.get("/health")
def health():
    return {"service": "shipping-service", "status": "healthy"}

@app.get("/")
def root():
    return {"service": "shipping-service", "message": "shipping-service online"}
