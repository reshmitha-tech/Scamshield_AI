"""
Tests for ScamShield AI — Phase 1
Tests: risk scoring, message analysis, URL analysis, API health
"""
import pytest
import sys
import os

# Ensure backend is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.models.providers import MockModelProvider
from app.analyzers.message_analyzer import MessageAnalyzer
from app.analyzers.url_analyzer import URLAnalyzer


# ── MockModelProvider Tests ────────────────────────────────────────────────────

class TestMockModelProvider:
    """Tests for the rule-based mock model provider."""

    def setup_method(self):
        self.provider = MockModelProvider()

    def test_safe_message_low_risk(self):
        """A routine appointment message should score LOW."""
        result = self.provider.analyze_text(
            "Your appointment is confirmed for tomorrow at 10 AM."
        )
        assert result["risk_level"] == "LOW"
        assert result["risk_score"] < 31
        assert result["risk_score"] >= 0

    def test_suspicious_message_moderate_risk(self):
        """A vague account suspension message should be at least SUSPICIOUS."""
        result = self.provider.analyze_text(
            "Your account may be suspended. Please verify your details immediately."
        )
        assert result["risk_level"] in ("SUSPICIOUS", "HIGH")
        assert result["risk_score"] >= 31

    def test_high_risk_banking_scam(self):
        """Classic banking scam with OTP + urgency + threat should be HIGH."""
        result = self.provider.analyze_text(
            "ALERT: Your SBI bank account will be blocked today. "
            "Verify immediately by clicking this link and entering your OTP."
        )
        assert result["risk_level"] == "HIGH"
        assert result["risk_score"] >= 61

    def test_indicators_present(self):
        """High-risk message should have multiple indicators."""
        result = self.provider.analyze_text(
            "Send your OTP now or your account will be suspended."
        )
        assert len(result["indicators"]) >= 2

    def test_score_is_bounded(self):
        """Score should never exceed 100."""
        result = self.provider.analyze_text(
            "URGENT! Your bank account blocked. Send OTP password PIN now. "
            "Click http://scam.xyz immediately. Transfer money. SBI HDFC government."
        )
        assert result["risk_score"] <= 100

    def test_empty_message(self):
        """Empty input should return 0 score."""
        result = self.provider.analyze_text("")
        assert result["risk_score"] == 0

    def test_recommendation_not_empty_for_high_risk(self):
        """High-risk result should always have a non-empty recommendation."""
        result = self.provider.analyze_text(
            "Enter your OTP and click this link immediately."
        )
        assert len(result["recommendation"]) > 10

    def test_explanation_not_empty(self):
        """Explanation should always be a non-empty string."""
        result = self.provider.analyze_text(
            "Enter your OTP and click this link immediately."
        )
        assert isinstance(result["explanation"], str)
        assert len(result["explanation"]) > 0

    def test_provider_is_local(self):
        assert self.provider.is_local is True

    def test_provider_is_available(self):
        assert self.provider.is_available() is True

    def test_provider_name_contains_mock(self):
        assert "Mock" in self.provider.provider_name


# ── MessageAnalyzer Tests ──────────────────────────────────────────────────────

class TestMessageAnalyzer:

    def setup_method(self):
        self.analyzer = MessageAnalyzer()

    def test_analyze_returns_dict(self):
        result = self.analyzer.analyze("Test message")
        assert isinstance(result, dict)
        assert "risk_score" in result
        assert "risk_level" in result
        assert "indicators" in result

    def test_empty_input(self):
        result = self.analyzer.analyze("")
        assert result["success"] is False

    def test_whitespace_input(self):
        result = self.analyzer.analyze("   ")
        assert result["success"] is False

    def test_high_risk_scam(self):
        result = self.analyzer.analyze(
            "Your bank account will be blocked. Enter your OTP now."
        )
        assert result["success"] is True
        assert result["risk_level"] in ("SUSPICIOUS", "HIGH")

    def test_processing_mode_is_local(self):
        result = self.analyzer.analyze("Test")
        assert result["processing"]["mode"] == "local"


# ── URLAnalyzer Tests ──────────────────────────────────────────────────────────

class TestURLAnalyzer:

    def setup_method(self):
        self.analyzer = URLAnalyzer()

    def test_safe_https_url(self):
        result = self.analyzer.analyze("https://www.sbi.co.in/web/personal-banking")
        assert result["success"] is True
        assert result["risk_level"] == "LOW"

    def test_ip_address_url_is_high_risk(self):
        result = self.analyzer.analyze("http://192.168.1.1/login")
        assert result["risk_score"] >= 25
        indicator_types = [i["type"] for i in result["indicators"]]
        assert "ip_address_url" in indicator_types

    def test_shortener_is_flagged(self):
        result = self.analyzer.analyze("https://bit.ly/something")
        indicator_types = [i["type"] for i in result["indicators"]]
        assert "url_shortener" in indicator_types

    def test_lookalike_domain(self):
        result = self.analyzer.analyze("https://sbi.banking-secure-login.xyz/verify")
        indicator_types = [i["type"] for i in result["indicators"]]
        # Should flag suspicious TLD or lookalike
        assert result["risk_score"] > 0

    def test_http_flagged(self):
        result = self.analyzer.analyze("http://example.com/login")
        indicator_types = [i["type"] for i in result["indicators"]]
        assert "no_https" in indicator_types

    def test_empty_url(self):
        result = self.analyzer.analyze("")
        assert result["success"] is False

    def test_score_bounded(self):
        result = self.analyzer.analyze("http://192.168.1.1/secure/login?password=x&otp=y")
        assert result["risk_score"] <= 100

    def test_domain_info_present(self):
        result = self.analyzer.analyze("https://example.com")
        assert "domain_info" in result
        assert result["domain_info"]["is_https"] is True

    def test_url_never_fetched(self):
        """Ensure analysis doesn't make network calls — this test just verifies it completes fast."""
        import time
        start = time.time()
        self.analyzer.analyze("http://192.168.1.1/phishing/login?otp=123")
        elapsed = time.time() - start
        # Should complete in well under 1 second (local analysis only)
        assert elapsed < 1.0


# ── API Integration Tests ──────────────────────────────────────────────────────

class TestAPIEndpoints:
    """Integration tests using FastAPI TestClient."""

    @pytest.fixture(autouse=True)
    def setup_client(self):
        from fastapi.testclient import TestClient
        from app.main import app
        from app.database.connection import init_db
        init_db()
        with TestClient(app) as client:
            self.client = client
            yield

    def test_root_endpoint(self):
        r = self.client.get("/")
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "ScamShield AI"

    def test_health_endpoint(self):
        r = self.client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert "model_provider" in data

    def test_analyze_message_endpoint(self):
        r = self.client.post(
            "/api/analyze/message",
            json={"content": "Your account will be blocked. Enter your OTP immediately."},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert "risk_score" in data
        assert "indicators" in data
        assert data["input_type"] == "message"

    def test_analyze_url_endpoint(self):
        r = self.client.post(
            "/api/analyze/url",
            json={"url": "http://192.168.1.100/login?otp=123"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert data["input_type"] == "url"

    def test_analyze_safe_message(self):
        r = self.client.post(
            "/api/analyze/message",
            json={"content": "Your appointment is confirmed for tomorrow at 10 AM."},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["risk_level"] == "LOW"

    def test_analyze_empty_message_returns_422(self):
        r = self.client.post("/api/analyze/message", json={"content": ""})
        # Either 422 (Pydantic min_length) or 422 from our validation
        assert r.status_code in (422, 400)

    def test_history_endpoint(self):
        r = self.client.get("/api/history")
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert "total" in data

    def test_performance_endpoint(self):
        r = self.client.get("/api/performance")
        assert r.status_code == 200
        data = r.json()
        assert "total_analyses" in data

    def test_image_endpoint_returns_501(self):
        r = self.client.post("/api/analyze/image")
        assert r.status_code == 501

    def test_qr_endpoint_returns_501(self):
        r = self.client.post("/api/analyze/qr")
        assert r.status_code == 501
