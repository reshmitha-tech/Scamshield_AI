"""
Pydantic schemas for API request/response validation.
These form the contract between the frontend and backend.
"""
from __future__ import annotations
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


# ─── Shared sub-schemas ────────────────────────────────────────────────────────

class Indicator(BaseModel):
    """A single detected risk indicator."""
    type: str = Field(..., description="Category: urgency, credential_request, suspicious_url, etc.")
    severity: str = Field(..., description="high | medium | low")
    evidence: str = Field(..., description="Quoted text or pattern that triggered this indicator")
    description: Optional[str] = Field(None, description="Human-readable explanation")


class ProcessingInfo(BaseModel):
    """Metadata about how the analysis was performed."""
    mode: str = Field("local", description="local | cloud | mock")
    model: str = Field("MockModelProvider", description="Model identifier")
    latency_ms: float = Field(0.0, description="Total processing time in milliseconds")
    model_latency_ms: Optional[float] = None
    ocr_latency_ms: Optional[float] = None
    qr_latency_ms: Optional[float] = None


# ─── Analysis Responses ────────────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    """Standard analysis response returned by all /api/analyze/* endpoints."""
    success: bool = True
    analysis_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    input_type: str
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str = Field(..., description="LOW | SUSPICIOUS | HIGH")
    indicators: List[Indicator] = []
    explanation: str = ""
    recommendation: str = ""
    processing: ProcessingInfo = Field(default_factory=ProcessingInfo)
    # Optional extras per analyzer
    extracted_text: Optional[str] = None
    extracted_url: Optional[str] = None
    domain_info: Optional[Dict[str, Any]] = None
    highlighted_phrases: Optional[List[str]] = None
    error: Optional[str] = None


# ─── Request schemas ───────────────────────────────────────────────────────────

class MessageAnalysisRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000, description="Message/SMS/email text to analyze")


class URLAnalysisRequest(BaseModel):
    url: str = Field(..., min_length=4, max_length=2048, description="URL to analyze")


# Image and QR are uploaded as multipart form data (FastAPI UploadFile), not JSON.


# ─── History ──────────────────────────────────────────────────────────────────

class HistoryItem(BaseModel):
    id: str
    timestamp: datetime
    input_type: str
    risk_score: int
    risk_level: str
    indicators: List[Indicator]
    explanation: str
    recommendation: str
    processing_mode: str
    model_name: str
    latency_ms: float
    content_preview: str

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    success: bool = True
    total: int
    items: List[HistoryItem]


# ─── Performance ──────────────────────────────────────────────────────────────

class PerformanceSummary(BaseModel):
    success: bool = True
    total_analyses: int = 0
    local_analyses: int = 0
    cloud_analyses: int = 0
    local_percentage: float = 0.0
    avg_latency_ms: float = 0.0
    avg_model_latency_ms: float = 0.0
    avg_ocr_latency_ms: Optional[float] = None
    avg_qr_latency_ms: Optional[float] = None
    breakdown_by_type: Dict[str, int] = {}
    # Demo values flag
    is_demo_data: bool = True
    note: str = "Performance metrics will reflect real measurements once AI models are integrated."


# ─── Health ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
    model_provider: str = "MockModelProvider"
    processing_mode: str = "local"
    database: str = "connected"
    offline_capable: bool = True
    snapdragon_ready: bool = False
    uptime_seconds: Optional[float] = None


# ─── Error ────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
