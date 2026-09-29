"""
OCR Analyzer — Extract text from uploaded screenshots using Pillow + pytesseract,
extract URLs, and run ScamShield AI analysis.
"""
from __future__ import annotations

import io
import re
import time
import logging
from typing import Dict, Any, List

try:
    from PIL import Image
    import pytesseract
    HAS_OCR_DEPS = True
except Exception:  # noqa: BLE001 — also catches OSError for missing system binaries
    HAS_OCR_DEPS = False

# ── Auto-detect Tesseract binary path on Windows ───────────────────────────────
import os
import sys

if HAS_OCR_DEPS and sys.platform == "win32":
    _TESSERACT_CANDIDATES = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        os.path.expandvars(r"%APPDATA%\Tesseract-OCR\tesseract.exe"),
    ]
    for _candidate in _TESSERACT_CANDIDATES:
        if os.path.exists(_candidate):
            pytesseract.pytesseract.tesseract_cmd = _candidate
            break

from app.analyzers.message_analyzer import MessageAnalyzer
from app.analyzers.url_analyzer import URLAnalyzer


logger = logging.getLogger(__name__)


class OCRAnalyzer:
    """Extracts text from screenshots and runs threat analysis on text & URLs."""

    def __init__(self):
        self.message_analyzer = MessageAnalyzer()
        self.url_analyzer = URLAnalyzer()

    def analyze_image_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        start = time.perf_counter()

        if not HAS_OCR_DEPS:
            return {
                "success": False,
                "error": "OCR dependencies (Pillow / pytesseract) are not installed.",
                "extracted_text": "",
                "extracted_url": None,
            }

        try:
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as exc:
            logger.warning("Failed to open image bytes: %s", exc)
            return {
                "success": False,
                "error": "Invalid image file format. Please upload a valid PNG, JPG, or JPEG image.",
                "extracted_text": "",
                "extracted_url": None,
            }

        ocr_start = time.perf_counter()
        extracted_text = ""
        ocr_error = None

        try:
            extracted_text = pytesseract.image_to_string(image).strip()
        except Exception as exc:
            logger.warning("Pytesseract error during image_to_string: %s", exc)
            ocr_error = (
                "Tesseract OCR engine binary is not installed on this system. "
                "To enable local OCR text extraction, install Tesseract OCR "
                "(https://github.com/UB-Mannheim/tesseract/wiki)."
            )

        ocr_latency_ms = (time.perf_counter() - ocr_start) * 1000

        if ocr_error or not extracted_text:
            return {
                "success": False,
                "error": ocr_error or "No text could be extracted from this screenshot.",
                "extracted_text": extracted_text,
                "extracted_url": None,
                "processing": {
                    "mode": "local",
                    "model": "tesseract-ocr",
                    "ocr_latency_ms": ocr_latency_ms,
                    "total_latency_ms": (time.perf_counter() - start) * 1000,
                },
            }

        # ── Extract URLs from extracted text ───────────────────────────────────
        urls = re.findall(r"https?://\S+|www\.\S+", extracted_text)
        extracted_url = urls[0] if urls else None

        # ── Message analysis ───────────────────────────────────────────────────
        msg_result = self.message_analyzer.analyze(extracted_text)

        # ── URL analysis if URL found ──────────────────────────────────────────
        url_indicators = []
        url_risk_score = 0
        if extracted_url:
            url_res = self.url_analyzer.analyze(extracted_url)
            if url_res.get("success"):
                url_indicators = url_res.get("indicators", [])
                url_risk_score = url_res.get("risk_score", 0)

        # ── Combine results ────────────────────────────────────────────────────
        all_indicators = msg_result.get("indicators", []) + url_indicators
        combined_score = min(max(msg_result.get("risk_score", 0), url_risk_score), 100)

        if combined_score >= 61:
            combined_risk_level = "HIGH"
        elif combined_score >= 31:
            combined_risk_level = "SUSPICIOUS"
        else:
            combined_risk_level = "LOW"

        total_latency_ms = (time.perf_counter() - start) * 1000

        return {
            "success": True,
            "input_type": "screenshot",
            "extracted_text": extracted_text,
            "extracted_url": extracted_url,
            "risk_score": combined_score,
            "risk_level": combined_risk_level,
            "indicators": all_indicators,
            "explanation": msg_result.get("explanation", ""),
            "recommendation": msg_result.get("recommendation", ""),
            "highlighted_phrases": msg_result.get("highlighted_phrases", []),
            "domain_info": url_res.get("domain_info") if extracted_url and "url_res" in locals() else None,
            "processing": {
                "mode": "local",
                "model": "tesseract-ocr + rules",
                "ocr_latency_ms": round(ocr_latency_ms, 2),
                "model_latency_ms": round(msg_result.get("processing", {}).get("latency_ms", 0.0), 2),
                "total_latency_ms": round(total_latency_ms, 2),
            },
        }
