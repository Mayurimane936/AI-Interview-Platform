from fastapi import FastAPI
from app.core.database import Base, engine
from app.models.user import User
from app.models.answer import Answer
from app.api.health import router as health_router
from app.api.redis_test import router as redis_router
from app.api.auth import router as auth_router
from app.api.interviews import router as interview_router
from app.api.questions import router as question_router
from pathlib import Path
from dotenv import load_dotenv
from app.api.analytics import router as analytics_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.dashboard import router as dashboard_router
from app.api import speech, stt

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI(
    title="AI Interview Platform",
    description="AI-powered technical interview platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://intervue-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(
    health_router,
    prefix="/health",
    tags=["Health"],
)

app.include_router(
    redis_router,
    prefix="/health",
    tags=["Health"],
)
app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"],
)

app.include_router(
    interview_router,
    prefix="/interviews",
    tags=["Interviews"],
)

app.include_router(
    question_router,
    prefix="/questions",
    tags=["Questions"],
)

app.include_router(
    analytics_router,    
    prefix="/analytics",
    tags=["Analytics"],
)

app.include_router(
    dashboard_router,    
    prefix="/dashboard",
    tags=["Dashboard"],
)

app.include_router(
    speech.router,
    prefix="/speech",
    tags=["Speech"],
)

app.include_router(stt.router, prefix="/stt", tags=["Speech-to-Text"])

@app.get("/")
def root():
    return {
        "message": "AI Interview Platform API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }