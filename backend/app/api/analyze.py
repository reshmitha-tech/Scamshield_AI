"""
FastAPI router — Analysis endpoints
POST /api/analyze/message
POST /api/analyze/url
POST /api/analyze/image
POST /api/analyze/qr
POST /api/analyze/qr-content
"""
from __future__ import annotations

import logging
import uuid
from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.schemas.schemas import (
    AnalysisResponse,
    MessageAnalysisRequest,
    URLAnalysisRequest,
    Indicator,
    ProcessingInfo,
)
from app.analyzers.message_analyzer import MessageAnalyzer
from app.analyzers.url_analyzer import URLAnalyzer
from app.analyzers.ocr_analyzer import OCRAnalyzer
from app.analyzers.qr_analyzer import QRAnalyzer
from app.services.history_service import HistoryService
from app.database.connection import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analyze", tags=["Analysis"])

_message_analyzer = MessageAnalyzer()
_url_analyzer = URLAnalyzer()
_ocr_analyzer = OCRAnalyzer()
_qr_analyzer = QRAnalyzer()


def _build_response(result: dict) -> AnalysisResponse:
    """Convert raw analyzer dict to AnalysisResponse schema."""
    if not result.get("success", True):
        # Return a graceful error response (200 OK) with clear error information
        # instead of raising HTTPException, so the frontend can display a
        # user-friendly error message (e.g. "Tesseract not installed").
        proc_raw = result.get("processing", {})
        processing = ProcessingInfo(
            mode=proc_raw.get("mode", "local"),
            model=proc_raw.get("model", "unknown"),
            latency_ms=proc_raw.get("latency_ms", proc_raw.get("total_latency_ms", 0.0)),
            ocr_latency_ms=proc_raw.get("ocr_latency_ms"),
            qr_latency_ms=proc_raw.get("qr_latency_ms"),
        )
        return AnalysisResponse(
            success=False,
            analysis_id=str(uuid.uuid4()),
            input_type=result.get("input_type", "unknown"),
            risk_score=0,
            risk_level="LOW",
            indicators=[],
            explanation="",
            recommendation="",
            processing=processing,
            extracted_text=result.get("extracted_text"),
            extracted_url=result.get("extracted_url"),
            error=result.get("error", "Analysis failed"),
        )

    indicators = [
        Indicator(
            type=i["type"],
            severity=i["severity"],
            evidence=i["evidence"],
            description=i.get("description"),
        )
        for i in result.get("indicators", [])
    ]
    proc_raw = result.get("processing", {})
    processing = ProcessingInfo(
        mode=proc_raw.get("mode", "local"),
        model=proc_raw.get("model", "unknown"),
        latency_ms=proc_raw.get("latency_ms", proc_raw.get("total_latency_ms", 0.0)),
        model_latency_ms=proc_raw.get("model_latency_ms"),
        ocr_latency_ms=proc_raw.get("ocr_latency_ms"),
        qr_latency_ms=proc_raw.get("qr_latency_ms"),
    )
    return AnalysisResponse(
        success=True,
        analysis_id=str(uuid.uuid4()),
        input_type=result.get("input_type", "message"),
        risk_score=result.get("risk_score", 0),
        risk_level=result.get("risk_level", "LOW"),
        indicators=indicators,
        explanation=result.get("explanation", ""),
        recommendation=result.get("recommendation", ""),
        processing=processing,
        highlighted_phrases=result.get("highlighted_phrases"),
        domain_info=result.get("domain_info"),
        extracted_text=result.get("extracted_text"),
        extracted_url=result.get("extracted_url"),
    )


# ── Message ────────────────────────────────────────────────────────────────────

@router.post("/message", response_model=AnalysisResponse, summary="Analyze a text message for scam indicators")
async def analyze_message(
    request: MessageAnalysisRequest,
    db: Session = Depends(get_db),
):
    logger.info("Analyzing message (length=%d)", len(request.content))
    result = _message_analyzer.analyze(request.content)
    response = _build_response(result)

    try:
        HistoryService.save_analysis(
            db=db,
            analysis_result=result,
            content_preview=request.content[:80],
        )
    except Exception as exc:
        logger.warning("Failed to save history: %s", exc)

    return response


# ── URL ────────────────────────────────────────────────────────────────────────

@router.post("/url", response_model=AnalysisResponse, summary="Analyze a URL for phishing indicators")
async def analyze_url(
    request: URLAnalysisRequest,
    db: Session = Depends(get_db),
):
    logger.info("Analyzing URL: %s", request.url[:100])
    result = _url_analyzer.analyze(request.url)
    response = _build_response(result)

    try:
        HistoryService.save_analysis(
            db=db,
            analysis_result=result,
            content_preview=request.url[:80],
        )
    except Exception as exc:
        logger.warning("Failed to save history: %s", exc)

    return response


# ── Image (Screenshot OCR) ───────────────────────────────────────────────────

@router.post("/image", response_model=AnalysisResponse, summary="Analyze a screenshot (OCR)")
async def analyze_image(
    file: UploadFile = File(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    upload = file or image
    if not upload:
        raise HTTPException(status_code=400, detail="No image file was provided. Upload an image file.")

    logger.info("Analyzing screenshot image: %s", upload.filename)
    contents = await upload.read()
    result = _ocr_analyzer.analyze_image_bytes(contents)
    response = _build_response(result)

    try:
        HistoryService.save_analysis(
            db=db,
            analysis_result=result,
            content_preview=f"Screenshot: {upload.filename}",
        )
    except Exception as exc:
        logger.warning("Failed to save history: %s", exc)

    return response


# ── QR Image Decoding ─────────────────────────────────────────────────────────

@router.post("/qr", response_model=AnalysisResponse, summary="Decode and analyze a QR code image")
async def analyze_qr(
    file: UploadFile = File(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    upload = file or image
    if not upload:
        raise HTTPException(status_code=400, detail="No QR image file was provided. Upload a QR image file.")

    logger.info("Analyzing QR code image: %s", upload.filename)
    contents = await upload.read()
    result = _qr_analyzer.analyze_qr_image_bytes(contents)
    response = _build_response(result)

    try:
        HistoryService.save_analysis(
            db=db,
            analysis_result=result,
            content_preview=f"QR Image: {upload.filename}",
        )
    except Exception as exc:
        logger.warning("Failed to save history: %s", exc)

    return response


# ── QR Content (Decoded content string) ────────────────────────────────────────

@router.post("/qr-content", response_model=AnalysisResponse, summary="Analyze decoded QR content")
async def analyze_qr_content(
    request: MessageAnalysisRequest,
    db: Session = Depends(get_db),
):
    logger.info("Analyzing decoded QR content: %s", request.content[:100])
    result = _qr_analyzer.analyze_qr_content(request.content)
    response = _build_response(result)

    try:
        HistoryService.save_analysis(
            db=db,
            analysis_result=result,
            content_preview=f"QR Content: {request.content[:80]}",
        )
    except Exception as exc:
        logger.warning("Failed to save history: %s", exc)

    return response
