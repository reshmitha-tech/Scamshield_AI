"""
FastAPI router — Performance & Health endpoints
GET /api/performance
GET /api/health
"""
from __future__ import annotations

import os
import time
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.schemas import PerformanceSummary, HealthResponse
from app.services.history_service import HistoryService
from app.models.providers import get_provider
from app.database.connection import get_db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["System"])

_start_time = time.time()


@router.get("/api/health", response_model=HealthResponse, summary="Health check")
async def health_check(db: Session = Depends(get_db)):
    provider = get_provider()

    # Quick DB check
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"

    return HealthResponse(
        status="ok",
        version="0.1.0",
        model_provider=provider.provider_name,
        processing_mode="local" if provider.is_local else "cloud",
        database=db_status,
        offline_capable=True,
        snapdragon_ready=False,
        uptime_seconds=round(time.time() - _start_time, 1),
    )


@router.get("/api/performance", response_model=PerformanceSummary, summary="Performance metrics")
async def get_performance(db: Session = Depends(get_db)):
    summary = HistoryService.get_performance_summary(db)
    return PerformanceSummary(
        success=True,
        total_analyses=summary["total_analyses"],
        local_analyses=summary["local_analyses"],
        cloud_analyses=summary["cloud_analyses"],
        local_percentage=summary["local_percentage"],
        avg_latency_ms=summary["avg_latency_ms"],
        avg_model_latency_ms=summary["avg_model_latency_ms"],
        breakdown_by_type=summary["breakdown_by_type"],
        is_demo_data=summary["is_demo_data"],
        note="Performance metrics will reflect real measurements once AI models are integrated."
        if summary["is_demo_data"]
        else "Metrics reflect real analysis runs.",
    )
