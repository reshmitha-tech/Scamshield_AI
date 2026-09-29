"""
QR Analyzer — Decode QR code images locally and analyze decoded content for phishing/scams.

Decoding backends (in priority order):
1. pyzbar — best accuracy, requires libzbar DLL on Windows
2. OpenCV QRCodeDetector — bundled with opencv-python-headless, no extra deps
"""
from __future__ import annotations

import io
import time
import logging
import numpy as np
from typing import Dict, Any

# ── pyzbar (preferred) ─────────────────────────────────────────────────────────
try:
    from PIL import Image as _PILImage
    import pyzbar.pyzbar as _pyzbar
    HAS_PYZBAR = True
except Exception:  # noqa: BLE001 — also catches FileNotFoundError for missing DLLs (Windows)
    HAS_PYZBAR = False
    _pyzbar = None  # type: ignore[assignment]
    _PILImage = None  # type: ignore[assignment]

# ── OpenCV fallback ────────────────────────────────────────────────────────────
try:
    import cv2 as _cv2
    HAS_OPENCV = True
except Exception:  # noqa: BLE001
    HAS_OPENCV = False
    _cv2 = None  # type: ignore[assignment]

# ── PIL for image loading ──────────────────────────────────────────────────────
try:
    from PIL import Image
    HAS_PIL = True
except Exception:  # noqa: BLE001
    HAS_PIL = False
    Image = None  # type: ignore[assignment]

from app.analyzers.url_analyzer import URLAnalyzer
from app.analyzers.message_analyzer import MessageAnalyzer

logger = logging.getLogger(__name__)

HAS_ANY_QR_DECODER = HAS_PYZBAR or HAS_OPENCV


class QRAnalyzer:
    """Decodes QR codes and analyzes destination URLs / payload text."""

    def __init__(self):
        self.url_analyzer = URLAnalyzer()
        self.message_analyzer = MessageAnalyzer()
        if HAS_PYZBAR:
            logger.info("QRAnalyzer using pyzbar for decoding")
        elif HAS_OPENCV:
            logger.info("QRAnalyzer using OpenCV QRCodeDetector as fallback")
        else:
            logger.warning("QRAnalyzer: no QR decoding backend available (pyzbar and OpenCV missing)")

    def analyze_qr_content(self, content: str) -> Dict[str, Any]:
        """Analyze pre-decoded text/URL content (e.g. from browser webcam scan)."""
        content = content.strip()

        if not content:
            return {
                "success": False,
                "error": "Decoded QR content is empty.",
            }

        is_url = content.startswith("http://") or content.startswith("https://") or "www." in content

        if is_url:
            res = self.url_analyzer.analyze(content)
            res["input_type"] = "qr"
            res["decoded_content"] = content
            res["extracted_url"] = content
            res["qr_detected"] = True
            return res
        else:
            res = self.message_analyzer.analyze(content)
            res["input_type"] = "qr"
            res["decoded_content"] = content
            res["extracted_url"] = None
            res["qr_detected"] = True
            return res

    def _decode_with_pyzbar(self, image_bytes: bytes) -> str | None:
        """Decode QR using pyzbar (requires libzbar DLL)."""
        if not HAS_PYZBAR or not HAS_PIL:
            return None
        try:
            image = Image.open(io.BytesIO(image_bytes))
            decoded_objs = _pyzbar.decode(image)
            if decoded_objs:
                return decoded_objs[0].data.decode("utf-8", errors="replace").strip()
        except Exception as exc:
            logger.debug("pyzbar decode failed: %s", exc)
        return None

    def _decode_with_opencv(self, image_bytes: bytes) -> str | None:
        """Decode QR using OpenCV QRCodeDetector (no extra system deps)."""
        if not HAS_OPENCV:
            return None
        try:
            img_array = np.frombuffer(image_bytes, dtype=np.uint8)
            img = _cv2.imdecode(img_array, _cv2.IMREAD_COLOR)
            if img is None:
                return None
            detector = _cv2.QRCodeDetector()
            data, _, _ = detector.detectAndDecode(img)
            if data:
                return data.strip()
        except Exception as exc:
            logger.debug("OpenCV QR decode failed: %s", exc)
        return None

    def analyze_qr_image_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        """Decode image bytes and analyze any detected QR code."""
        start = time.perf_counter()

        if not HAS_ANY_QR_DECODER:
            return {
                "success": False,
                "input_type": "qr",
                "error": (
                    "QR image decoding is not available. Neither pyzbar (missing libzbar DLL) "
                    "nor OpenCV could be loaded. Use the live camera scanner instead, or install "
                    "the ZBar library from https://github.com/NaturalHistoryMuseum/pyzbar."
                ),
                "qr_detected": False,
            }

        qr_start = time.perf_counter()
        decoded_content = None
        decoder_used = "none"

        # Try pyzbar first (more accurate), then OpenCV
        if HAS_PYZBAR:
            decoded_content = self._decode_with_pyzbar(image_bytes)
            if decoded_content:
                decoder_used = "pyzbar"

        if not decoded_content and HAS_OPENCV:
            decoded_content = self._decode_with_opencv(image_bytes)
            if decoded_content:
                decoder_used = "opencv-qrdetector"

        qr_latency_ms = (time.perf_counter() - qr_start) * 1000

        if not decoded_content:
            return {
                "success": False,
                "input_type": "qr",
                "error": "No QR code could be detected or decoded in this image. Ensure the image is clear and well-lit.",
                "qr_detected": False,
                "processing": {
                    "mode": "local",
                    "model": decoder_used,
                    "qr_latency_ms": round(qr_latency_ms, 2),
                    "total_latency_ms": round((time.perf_counter() - start) * 1000, 2),
                },
            }

        analysis = self.analyze_qr_content(decoded_content)
        analysis["processing"] = {
            "mode": "local",
            "model": f"{decoder_used} + rules",
            "qr_latency_ms": round(qr_latency_ms, 2),
            "total_latency_ms": round((time.perf_counter() - start) * 1000, 2),
        }
        return analysis
