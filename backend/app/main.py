from fastapi import FastAPI
from app.routers.auth import router as auth_router

app = FastAPI(
    title="AI Business Intelligence Platform",
    version="1.0.0"
)

app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "AI Business Intelligence Platform API"
    }