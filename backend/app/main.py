"""
ScamShield AI — FastAPI Application Entry Point
================================================
Privacy-first, explainable AI scam detection backend.

Running locally:
  uvicorn app.main:app --reload --port 8000

Docs available at:
  http://localhost:8000/docs
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database.connection import init_db
from app.api import analyze, history, system
from app.models.providers import get_provider

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    logger.info("ScamShield AI backend starting up...")
    init_db()
    provider = get_provider()
    logger.info("AI Model Provider: %s", provider.provider_name)
    logger.info("Local processing: %s", provider.is_local)
    logger.info("Backend ready at http://localhost:8000")
    yield
    logger.info("ScamShield AI backend shutting down.")


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ScamShield AI",
    description=(
        "Privacy-first, explainable AI scam detection API. "
        "All analysis is performed locally — your data is never sent to external services by default."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# Allow the Vite dev server and any local origin.
# In production, restrict to your actual domain.
allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global error handler ───────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An internal server error occurred. Please try again.",
            "detail": None,  # Never expose stack traces to the client
        },
    )


# ── Routers ────────────────────────────────────────────────────────────────────

app.include_router(analyze.router)
app.include_router(history.router)
app.include_router(system.router)


# ── Root ───────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "ScamShield AI",
        "version": "0.1.0",
        "description": "Privacy-first, explainable AI scam detection",
        "docs": "http://localhost:8000/docs",
        "health": "http://localhost:8000/api/health",
        "status": "running",
    }
