from fastapi import FastAPI

from app.routers.auth import router as auth_router
from app.routers.company import router as company_router

app = FastAPI(
    title="AI Business Intelligence Platform",
    version="1.0.0"
)

app.include_router(auth_router)
app.include_router(company_router)


@app.get("/")
def root():
    return {
        "message": "AI Business Intelligence Platform API"
    }