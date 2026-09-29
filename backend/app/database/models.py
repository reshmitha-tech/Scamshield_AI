"""
SQLAlchemy ORM models for ScamShield AI.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, JSON
from app.database.connection import Base


def generate_uuid():
    return str(uuid.uuid4())


class AnalysisRecord(Base):
    """Stores analysis results. Sensitive content is NOT stored by default."""
    __tablename__ = "analysis_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    input_type = Column(String(50), nullable=False)       # message, url, image, qr
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False)       # LOW, SUSPICIOUS, HIGH
    indicators = Column(JSON, default=list)
    explanation = Column(Text, default="")
    recommendation = Column(Text, default="")
    processing_mode = Column(String(20), default="local") # local, cloud
    model_name = Column(String(100), default="MockModelProvider")
    latency_ms = Column(Float, default=0.0)
    # Store only a short, non-sensitive preview (first 80 chars), never the full input
    content_preview = Column(String(120), default="")
    success = Column(Boolean, default=True)


class PerformanceMetric(Base):
    """Stores per-analysis performance timing."""
    __tablename__ = "performance_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    analysis_id = Column(String, nullable=True)
    input_type = Column(String(50))
    total_latency_ms = Column(Float, default=0.0)
    model_latency_ms = Column(Float, default=0.0)
    ocr_latency_ms = Column(Float, nullable=True)
    qr_latency_ms = Column(Float, nullable=True)
    processing_mode = Column(String(20), default="local")
