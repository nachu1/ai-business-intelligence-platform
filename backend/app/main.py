import asyncio

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.jobs.worker import analysis_worker

from app.documents.router import router as document_router
from app.routers.auth import router as auth_router
from app.routers.company import router as company_router
from app.routers.user import router as user_router
from app.dashboard.router import router as dashboard_router
from app.chat.router import router as chat_router
from app.routers.invite import router as invite_router
from app.routers.activation import router as activation_router
from app.messages.router import router as messages_router
from app.tasks.router import router as tasks_router
from app.reports.router import router as reports_router
from app.notifications.router import router as notification_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    worker_task = asyncio.create_task(
        analysis_worker()
    )

    print("Analysis worker started.")

    yield

    worker_task.cancel()

    try:
        await worker_task
    except asyncio.CancelledError:
        pass

    print("Analysis worker stopped.")


app = FastAPI(
    title="AI Business Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://172.20.10.4:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(company_router)

app.include_router(invite_router)
app.include_router(activation_router)
app.include_router(user_router)

app.include_router(dashboard_router)
app.include_router(document_router)
app.include_router(chat_router)
app.include_router(messages_router)
app.include_router(tasks_router)
app.include_router(reports_router)
app.include_router(notification_router)


@app.get("/")
def root():
    return {
        "message": "AI Business Intelligence Platform API"
    }