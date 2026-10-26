import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dashboard import router as dashboard_router
from app.api.generate import router as generate_router
from app.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


def log_startup_config() -> None:
    if settings.dashboard_demo_mode:
        logger.warning(
            "DASHBOARD_DEMO_MODE is enabled. Sample data will be served "
            "without authentication. Disable it in production."
        )
    elif not settings.supabase_configured:
        logger.warning(
            "Supabase is not fully configured (SUPABASE_URL, "
            "SUPABASE_SERVICE_ROLE_KEY). GET /api/dashboard will return 503 "
            "until it is. See backend/.env.example."
        )

    if not settings.groq_configured:
        logger.warning(
            "GROQ_API_KEY is not set. Students who select Groq in Settings "
            "will get a 503 (provider_not_configured) from POST /api/generate. "
            "See backend/.env.example."
        )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    log_startup_config()
    yield


app = FastAPI(
    title="AI Learning Tutor API",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ai-tutor-hashim123132s-projects.vercel.app",
        "https://ai-tutor-two-ivory.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)
app.include_router(generate_router)


@app.get("/")
def root():
    return {"message": "AI Learning Tutor API is running"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
