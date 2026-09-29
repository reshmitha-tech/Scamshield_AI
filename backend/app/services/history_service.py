"""
History Service — manages persistence of analysis records.
"""
from __future__ import annotations

import logging
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.models import AnalysisRecord, PerformanceMetric

logger = logging.getLogger(__name__)


class HistoryService:

    @staticmethod
    def save_analysis(
        db: Session,
        analysis_result: dict,
        content_preview: str = "",
    ) -> AnalysisRecord:
        """Persist an analysis result. Only a short preview is stored, not the full input."""
        record = AnalysisRecord(
            input_type=analysis_result.get("input_type", "unknown"),
            risk_score=analysis_result.get("risk_score", 0),
            risk_level=analysis_result.get("risk_level", "LOW"),
            indicators=analysis_result.get("indicators", []),
            explanation=analysis_result.get("explanation", ""),
            recommendation=analysis_result.get("recommendation", ""),
            processing_mode=analysis_result.get("processing", {}).get("mode", "local"),
            model_name=analysis_result.get("processing", {}).get("model", "unknown"),
            latency_ms=analysis_result.get("processing", {}).get("latency_ms", 0.0),
            content_preview=content_preview[:120] if content_preview else "",
            success=analysis_result.get("success", True),
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        # Also store performance metric
        HistoryService._save_perf(db, record.id, analysis_result)

        return record

    @staticmethod
    def _save_perf(db: Session, analysis_id: str, result: dict):
        proc = result.get("processing", {})
        metric = PerformanceMetric(
            analysis_id=analysis_id,
            input_type=result.get("input_type", "unknown"),
            total_latency_ms=proc.get("latency_ms", 0.0),
            model_latency_ms=proc.get("model_latency_ms", 0.0),
            ocr_latency_ms=proc.get("ocr_latency_ms"),
            qr_latency_ms=proc.get("qr_latency_ms"),
            processing_mode=proc.get("mode", "local"),
        )
        db.add(metric)
        db.commit()

    @staticmethod
    def get_history(
        db: Session,
        limit: int = 50,
        offset: int = 0,
        input_type: Optional[str] = None,
    ) -> tuple[List[AnalysisRecord], int]:
        query = db.query(AnalysisRecord)
        if input_type:
            query = query.filter(AnalysisRecord.input_type == input_type)
        total = query.count()
        items = query.order_by(AnalysisRecord.timestamp.desc()).offset(offset).limit(limit).all()
        return items, total

    @staticmethod
    def delete_record(db: Session, record_id: str) -> bool:
        record = db.query(AnalysisRecord).filter(AnalysisRecord.id == record_id).first()
        if record:
            db.delete(record)
            db.commit()
            return True
        return False

    @staticmethod
    def clear_all(db: Session) -> int:
        count = db.query(AnalysisRecord).count()
        db.query(AnalysisRecord).delete()
        db.query(PerformanceMetric).delete()
        db.commit()
        return count

    @staticmethod
    def get_performance_summary(db: Session) -> dict:
        from sqlalchemy import func

        metrics = db.query(PerformanceMetric).all()
        if not metrics:
            return {
                "total_analyses": 0,
                "local_analyses": 0,
                "cloud_analyses": 0,
                "local_percentage": 0.0,
                "avg_latency_ms": 0.0,
                "avg_model_latency_ms": 0.0,
                "breakdown_by_type": {},
                "is_demo_data": True,
            }

        total = len(metrics)
        local = sum(1 for m in metrics if m.processing_mode == "local")
        avg_lat = sum(m.total_latency_ms for m in metrics) / total
        avg_model = sum((m.model_latency_ms or 0) for m in metrics) / total

        breakdown: dict = {}
        for m in metrics:
            breakdown[m.input_type] = breakdown.get(m.input_type, 0) + 1

        return {
            "total_analyses": total,
            "local_analyses": local,
            "cloud_analyses": total - local,
            "local_percentage": round(local / total * 100, 1) if total else 0.0,
            "avg_latency_ms": round(avg_lat, 2),
            "avg_model_latency_ms": round(avg_model, 2),
            "breakdown_by_type": breakdown,
            "is_demo_data": False,
        }
