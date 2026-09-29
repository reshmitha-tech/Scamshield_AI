"""
FastAPI router — History endpoint
GET /api/history
DELETE /api/history/{id}
DELETE /api/history
"""
from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.schemas.schemas import HistoryResponse, HistoryItem
from app.services.history_service import HistoryService
from app.database.connection import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("", response_model=HistoryResponse, summary="Get analysis history")
async def get_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    input_type: str | None = Query(None, description="Filter by type: message, url, image, qr"),
    db: Session = Depends(get_db),
):
    items, total = HistoryService.get_history(db, limit=limit, offset=offset, input_type=input_type)
    history_items = [HistoryItem.model_validate(item) for item in items]
    return HistoryResponse(success=True, total=total, items=history_items)


@router.delete("/{record_id}", summary="Delete a single history record")
async def delete_record(record_id: str, db: Session = Depends(get_db)):
    deleted = HistoryService.delete_record(db, record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Record not found.")
    return {"success": True, "message": f"Record {record_id} deleted."}


@router.delete("", summary="Clear all history")
async def clear_history(db: Session = Depends(get_db)):
    count = HistoryService.clear_all(db)
    return {"success": True, "message": f"Cleared {count} records."}
