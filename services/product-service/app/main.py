from fastapi import FastAPI

app = FastAPI(title="Sentinel product-service")

@app.get("/health")
def health():
    return {"service": "product-service", "status": "healthy"}

@app.get("/")
def root():
    return {"service": "product-service", "message": "product-service online"}
