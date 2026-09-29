"""
URL Analyzer — Tool 2 of ScamShield AI Agent
Analyzes URLs for phishing/suspicious indicators WITHOUT visiting them.
"""
from __future__ import annotations

import re
import time
import logging
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Known URL shorteners
URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
    "buff.ly", "adf.ly", "bc.vc", "tiny.cc", "lc.chat", "rebrand.ly",
    "cutt.ly", "shorturl.at", "rb.gy",
}

# Suspicious TLDs frequently abused in phishing
SUSPICIOUS_TLDS = {
    ".xyz", ".top", ".click", ".loan", ".work", ".download",
    ".racing", ".faith", ".win", ".review", ".stream", ".gq",
    ".ml", ".cf", ".tk",
}

# Legitimate brands commonly spoofed
SPOOFED_BRANDS = [
    "paypal", "amazon", "google", "microsoft", "apple", "netflix",
    "facebook", "instagram", "twitter", "sbi", "hdfc", "icici",
    "axis", "paytm", "flipkart", "irctc", "uidai", "income-tax",
]

# Suspicious path keywords
SUSPICIOUS_PATHS = [
    "login", "signin", "verify", "account", "update", "secure",
    "confirm", "banking", "password", "otp", "auth", "validate",
]

# Suspicious query param names
SUSPICIOUS_PARAMS = [
    "token", "session", "auth", "otp", "pass", "password",
    "secret", "key", "redirect", "url", "next",
]


class URLAnalyzer:
    """
    Analyzes URLs for phishing and suspicious characteristics.
    NEVER automatically visits or fetches the URL.
    """

    def analyze(self, url: str) -> Dict[str, Any]:
        if not url or not url.strip():
            return self._empty_result("URL is empty.")

        url = url.strip()
        # Ensure parseable — add scheme if missing for parsing
        if not url.startswith(("http://", "https://")):
            parse_url = "https://" + url
            had_scheme = False
        else:
            parse_url = url
            had_scheme = True

        start = time.perf_counter()

        try:
            parsed = urlparse(parse_url)
        except Exception as exc:
            return self._error_result(f"Invalid URL format: {exc}")

        indicators: List[Dict[str, Any]] = []
        score = 0
        domain_info: Dict[str, Any] = {}

        domain = parsed.netloc.lower()
        scheme = parsed.scheme
        path = parsed.path.lower()
        query = parsed.query.lower()
        hostname = parsed.hostname or ""

        domain_info["domain"] = domain
        domain_info["scheme"] = scheme
        domain_info["path"] = path
        domain_info["hostname"] = hostname
        domain_info["is_https"] = scheme == "https"
        domain_info["is_ip_address"] = bool(re.match(r"^\d{1,3}(\.\d{1,3}){3}$", hostname))
        domain_info["is_shortener"] = hostname in URL_SHORTENERS

        # ── HTTP (not HTTPS) ────────────────────────────────────────────────
        if not had_scheme or scheme == "http":
            score += 10
            indicators.append({
                "type": "no_https",
                "severity": "medium",
                "evidence": url,
                "description": "The URL uses HTTP, not HTTPS. Data sent to this URL is not encrypted.",
            })

        # ── IP address as hostname ──────────────────────────────────────────
        if domain_info["is_ip_address"]:
            score += 25
            indicators.append({
                "type": "ip_address_url",
                "severity": "high",
                "evidence": hostname,
                "description": "The URL uses a raw IP address instead of a domain name, which is a common phishing tactic.",
            })

        # ── URL shortener ───────────────────────────────────────────────────
        if domain_info["is_shortener"]:
            score += 20
            indicators.append({
                "type": "url_shortener",
                "severity": "high",
                "evidence": hostname,
                "description": "This URL uses a shortening service, which hides the actual destination.",
            })

        # ── Suspicious TLD ──────────────────────────────────────────────────
        for tld in SUSPICIOUS_TLDS:
            if hostname.endswith(tld):
                score += 15
                indicators.append({
                    "type": "suspicious_tld",
                    "severity": "medium",
                    "evidence": hostname,
                    "description": f"The domain uses the TLD '{tld}', which is frequently used in phishing campaigns.",
                })
                break

        # ── Lookalike / brand-in-subdomain ──────────────────────────────────
        parts = hostname.split(".")
        # If brand appears in subdomain (not in root domain), flag it
        if len(parts) > 2:
            subdomain = ".".join(parts[:-2])
            for brand in SPOOFED_BRANDS:
                if brand in subdomain:
                    score += 30
                    indicators.append({
                        "type": "lookalike_domain",
                        "severity": "high",
                        "evidence": hostname,
                        "description": f"The domain appears to impersonate '{brand}' by placing the brand name in a subdomain. The actual domain is '{'.'.join(parts[-2:])}', not '{brand}'.",
                    })
                    break

        # ── Excessive subdomains ─────────────────────────────────────────────
        if len(parts) > 4:
            score += 10
            indicators.append({
                "type": "excessive_subdomains",
                "severity": "low",
                "evidence": hostname,
                "description": "The URL has an unusually large number of subdomains, which is sometimes used to obscure the real domain.",
            })

        # ── Suspicious path keywords ─────────────────────────────────────────
        path_hits = [kw for kw in SUSPICIOUS_PATHS if f"/{kw}" in path or f"/{kw}?" in path]
        if path_hits:
            score += 10
            indicators.append({
                "type": "suspicious_path",
                "severity": "medium",
                "evidence": path_hits[0],
                "description": f"The URL path contains keywords associated with credential harvesting pages: {', '.join(path_hits)}.",
            })

        # ── Suspicious query parameters ──────────────────────────────────────
        try:
            params = parse_qs(parsed.query)
            param_hits = [p for p in params if p.lower() in SUSPICIOUS_PARAMS]
            if param_hits:
                score += 10
                indicators.append({
                    "type": "suspicious_query_params",
                    "severity": "medium",
                    "evidence": ", ".join(param_hits),
                    "description": f"The URL contains query parameters commonly seen in phishing: {', '.join(param_hits)}.",
                })
        except Exception:
            pass

        # ── Special/obfuscation characters ──────────────────────────────────
        if "@" in hostname or "%40" in url or "xn--" in hostname:
            score += 20
            indicators.append({
                "type": "obfuscated_url",
                "severity": "high",
                "evidence": url[:80],
                "description": "The URL contains obfuscation characters (@ symbol, percent encoding, or internationalized domain) that may hide the real destination.",
            })

        score = min(score, 100)

        if score >= 61:
            risk_level = "HIGH"
        elif score >= 31:
            risk_level = "SUSPICIOUS"
        else:
            risk_level = "LOW"

        explanation = self._build_explanation(risk_level, indicators, domain_info)
        recommendation = self._build_recommendation(risk_level, indicators)

        latency_ms = (time.perf_counter() - start) * 1000

        return {
            "success": True,
            "input_type": "url",
            "risk_score": score,
            "risk_level": risk_level,
            "indicators": indicators,
            "explanation": explanation,
            "recommendation": recommendation,
            "domain_info": domain_info,
            "processing": {
                "mode": "local",
                "model": "URLAnalyzer [rule-based, no network requests]",
                "latency_ms": round(latency_ms, 2),
            },
        }

    def _build_explanation(self, risk_level: str, indicators: List[Dict], domain_info: Dict) -> str:
        if not indicators:
            return (
                f"No significant suspicious indicators were found in this URL. "
                f"The domain '{domain_info.get('hostname')}' uses HTTPS and does not match known phishing patterns. "
                f"Always exercise caution before entering credentials on any website."
            )
        indicator_types = [i["type"] for i in indicators]
        parts = []
        if "ip_address_url" in indicator_types:
            parts.append("uses a raw IP address instead of a domain name")
        if "url_shortener" in indicator_types:
            parts.append("uses a URL shortening service that hides the real destination")
        if "lookalike_domain" in indicator_types:
            parts.append("appears to impersonate a legitimate brand via a fake subdomain")
        if "no_https" in indicator_types:
            parts.append("does not use HTTPS encryption")
        if "suspicious_path" in indicator_types:
            parts.append("contains path keywords common in phishing pages")

        desc = "This URL " + ", ".join(parts) + "."
        level_note = {
            "HIGH": " These are strong indicators of a phishing or malicious URL. Do not visit this link.",
            "SUSPICIOUS": " These signals warrant caution. Verify the URL before visiting.",
            "LOW": " Exercise standard caution.",
        }.get(risk_level, "")
        return desc + level_note

    def _build_recommendation(self, risk_level: str, indicators: List[Dict]) -> str:
        types = [i["type"] for i in indicators]
        if risk_level == "HIGH":
            return (
                "Do not visit this URL. If you need to access the service it claims to represent, "
                "go directly to the official website by typing the address manually in your browser."
            )
        if "url_shortener" in types:
            return "Use a URL expansion tool (e.g., unshorten.me) to reveal the real destination before visiting."
        if risk_level == "SUSPICIOUS":
            return "Verify this URL carefully before visiting. Check the domain name matches the legitimate organisation exactly."
        return "This URL appears low-risk, but always verify the destination before entering any credentials."

    @staticmethod
    def _empty_result(msg: str) -> Dict[str, Any]:
        return {
            "success": False,
            "input_type": "url",
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
            "input_type": "url",
            "risk_score": 0,
            "risk_level": "LOW",
            "indicators": [],
            "explanation": "URL analysis failed.",
            "recommendation": "Please check the URL format and try again.",
            "error": msg,
            "processing": {"mode": "local", "model": "error", "latency_ms": 0},
        }
