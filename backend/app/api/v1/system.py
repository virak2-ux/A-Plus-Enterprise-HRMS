from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_permission
from app.models.system import AuditLog, SystemSetting
from app.schemas.common import APIResponse, PaginatedResponse

router = APIRouter()


@router.get("/audit-logs", response_model=PaginatedResponse[dict])
def list_audit_logs(
    module: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("system:audit")),
):
    query = db.query(AuditLog)
    if module:
        query = query.filter(AuditLog.module == module)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    total = query.count()
    records = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    total_pages = (total + limit - 1) // limit

    items = [
        {
            "id": r.id,
            "user_id": r.user_id,
            "action": r.action,
            "module": r.module,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "old_values": r.old_values,
            "new_values": r.new_values,
            "ip_address": r.ip_address,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]

    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/settings", response_model=APIResponse[List[dict]])
def list_settings(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("system:configure")),
):
    query = db.query(SystemSetting)
    if category:
        query = query.filter(SystemSetting.category == category)
    settings = query.all()
    items = [
        {
            "id": s.id,
            "category": s.category,
            "key": s.key,
            "value": s.value,
            "description": s.description,
        }
        for s in settings
    ]
    return APIResponse(data=items, message="System settings retrieved")
