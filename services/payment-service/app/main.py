from fastapi import FastAPI

app = FastAPI(title="Sentinel payment-service")

@app.get("/health")
def health():
    return {"service": "payment-service", "status": "healthy"}

@app.get("/")
def root():
    return {"service": "payment-service", "message": "payment-service online"}
