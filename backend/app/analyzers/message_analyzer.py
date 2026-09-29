"""
Message Analyzer — Tool 1 of ScamShield AI Agent
Analyzes text messages/SMS/emails for social engineering and phishing indicators.
"""
from __future__ import annotations

import time
import logging
from typing import Dict, Any

from app.models.providers import get_provider

logger = logging.getLogger(__name__)


class MessageAnalyzer:
    """
    Wraps the AI model provider to analyze text-based messages.
    Handles preprocessing, provider invocation, and result normalization.
    """

    def analyze(self, content: str) -> Dict[str, Any]:
        """
        Analyze a message for scam/phishing indicators.

        Args:
            content: Raw message text (SMS, email body, chat message, etc.)

        Returns:
            Normalized analysis result dict compatible with AnalysisResponse schema.
        """
        if not content or not content.strip():
            return self._empty_result("Message content is empty.")

        start = time.perf_counter()
        provider = get_provider()

        try:
            result = provider.analyze_text(content.strip(), context="message")
        except Exception as exc:
            logger.error("MessageAnalyzer: provider error: %s", exc, exc_info=True)
            return self._error_result(str(exc))

        total_latency = (time.perf_counter() - start) * 1000

        return {
            "success": True,
            "input_type": "message",
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "indicators": result["indicators"],
            "explanation": result["explanation"],
            "recommendation": result["recommendation"],
            "highlighted_phrases": result.get("highlighted_phrases", []),
            "processing": {
                "mode": "local" if provider.is_local else "cloud",
                "model": provider.provider_name,
                "latency_ms": round(total_latency, 2),
                "model_latency_ms": round(result.get("latency_ms", 0), 2),
            },
        }

    @staticmethod
    def _empty_result(msg: str) -> Dict[str, Any]:
        return {
            "success": False,
            "input_type": "message",
            "risk_score": 0,
            "risk_level": "LOW",
            "indicators": [],
            "explanation": msg,
            "recommendation": "",
            "error": msg,
            "processing": {"mode": "local", "model": "none", "latency_ms": 0},
        }

    @staticmethod
    def _error_result(msg: str) -> Dict[str, Any]:
        return {
            "success": False,
            "input_type": "message",
            "risk_score": 0,
            "risk_level": "LOW",
            "indicators": [],
            "explanation": "Analysis failed due to an internal error.",
            "recommendation": "Please try again.",
            "error": msg,
            "processing": {"mode": "local", "model": "error", "latency_ms": 0},
        }
