from fastapi import FastAPI

app = FastAPI(title="Sentinel auth-service")

@app.get("/health")
def health():
    return {"service": "auth-service", "status": "healthy"}

@app.get("/")
def root():
    return {"service": "auth-service", "message": "auth-service online"}
