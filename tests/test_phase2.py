"""
Tests for ScamShield AI — Phase 4 & 5
Screenshot OCR Analysis & QR Code Scanning (Upload + Decoded Content)
"""
import io
import pytest
import sys
import os

# Ensure backend is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from PIL import Image, ImageDraw
import qrcode

from app.analyzers.ocr_analyzer import OCRAnalyzer
from app.analyzers.qr_analyzer import QRAnalyzer


def create_test_image_with_text(text: str) -> bytes:
    """Helper to create a PNG image with drawn text."""
    img = Image.new('RGB', (400, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 40), text, fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


def create_test_qr_image(content: str) -> bytes:
    """Helper to generate a real QR code PNG image."""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(content)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


# ── OCRAnalyzer Tests ──────────────────────────────────────────────────────────

class TestOCRAnalyzer:

    def setup_method(self):
        self.analyzer = OCRAnalyzer()

    def test_invalid_image_bytes(self):
        result = self.analyzer.analyze_image_bytes(b"not an image")
        assert result["success"] is False
        assert "Invalid image file format" in result["error"]

    def test_blank_image(self):
        blank = Image.new('RGB', (100, 100), color=(255, 255, 255))
        buf = io.BytesIO()
        blank.save(buf, format='PNG')
        result = self.analyzer.analyze_image_bytes(buf.getvalue())
        assert result["success"] is False


# ── QRAnalyzer Tests ───────────────────────────────────────────────────────────

class TestQRAnalyzer:

    def setup_method(self):
        self.analyzer = QRAnalyzer()

    def test_decode_safe_qr_image(self):
        qr_bytes = create_test_qr_image("https://www.sbi.co.in/web/personal-banking")
        result = self.analyzer.analyze_qr_image_bytes(qr_bytes)
        assert result["success"] is True
        assert result["qr_detected"] is True
        assert result["risk_level"] == "LOW"

    def test_decode_suspicious_phishing_qr(self):
        qr_bytes = create_test_qr_image("http://192.168.1.100/login?otp=998877")
        result = self.analyzer.analyze_qr_image_bytes(qr_bytes)
        assert result["success"] is True
        assert result["qr_detected"] is True
        assert result["risk_score"] >= 25

    def test_image_with_no_qr_code(self):
        blank = Image.new('RGB', (200, 200), color=(255, 255, 255))
        buf = io.BytesIO()
        blank.save(buf, format='PNG')
        result = self.analyzer.analyze_qr_image_bytes(buf.getvalue())
        assert result["success"] is False
        assert result["qr_detected"] is False
        assert "No QR code could be detected" in result["error"]

    def test_analyze_qr_content_safe_url(self):
        result = self.analyzer.analyze_qr_content("https://www.sbi.co.in")
        assert result["success"] is True
        assert result["risk_level"] == "LOW"

    def test_analyze_qr_content_phishing_url(self):
        result = self.analyzer.analyze_qr_content("http://sbi.banking-secure-login.xyz/verify")
        assert result["success"] is True
        assert result["risk_score"] > 0

    def test_empty_qr_content(self):
        result = self.analyzer.analyze_qr_content("")
        assert result["success"] is False


# ── API Endpoint Tests ─────────────────────────────────────────────────────────

class TestAPIEndpointsPhase2:

    @pytest.fixture(autouse=True)
    def setup_client(self):
        from fastapi.testclient import TestClient
        from app.main import app
        from app.database.connection import init_db
        init_db()
        with TestClient(app) as client:
            self.client = client
            yield

    def test_qr_image_endpoint_safe(self):
        qr_bytes = create_test_qr_image("https://www.sbi.co.in")
        response = self.client.post(
            "/api/analyze/qr",
            files={"file": ("test_qr.png", qr_bytes, "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["input_type"] == "qr"

    def test_qr_image_endpoint_no_qr(self):
        blank = Image.new('RGB', (100, 100), color=(255, 255, 255))
        buf = io.BytesIO()
        blank.save(buf, format='PNG')
        response = self.client.post(
            "/api/analyze/qr",
            files={"file": ("blank.png", buf.getvalue(), "image/png")},
        )
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_qr_content_endpoint(self):
        response = self.client.post(
            "/api/analyze/qr-content",
            json={"content": "http://192.168.1.1/phishing/login"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["input_type"] == "qr"
        assert data["risk_score"] >= 25
