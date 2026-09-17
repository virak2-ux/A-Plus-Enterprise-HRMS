from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_permission
from app.models.system import AuditLog, SystemSetting
from app.schemas.common import APIResponse, PaginatedResponse
from app.services.audit_service import AuditService

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


@router.get("/settings", response_model=APIResponse[Dict[str, Any]])
def list_settings(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("system:configure")),
):
    """Retrieves all system settings formatted as a key-value map."""
    query = db.query(SystemSetting)
    if category:
        query = query.filter(SystemSetting.category == category)
    settings = query.all()

    # Defaults for Cambodia enterprise operations
    default_map = {
        "company_name_kh": "ក្រុមហ៊ុន ខេមតិច សូលូសិន ឯ.ក",
        "company_name_en": "CamTech Solutions Co., Ltd.",
        "tax_id": "K008-987654321",
        "nssf_id": "0098765432",
        "exchange_rate": 4100,
        "dependent_rebate": 150000,
        "nssf_ceiling": 1200000,
        "ai_enabled": False,
        "allow_employee_data_to_ai": False,
        "allow_salary_data_to_ai": False,
    }

    result = dict(default_map)
    for s in settings:
        result[s.key] = s.value

    return APIResponse(data=result, message="System settings retrieved")


@router.put("/settings", response_model=APIResponse[Dict[str, Any]])
def update_settings(
    settings_payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("system:configure")),
):
    """Updates or creates system settings with an audit log record."""
    old_snapshot = {}
    new_snapshot = {}

    for key, val in settings_payload.items():
        # Determine category based on key prefix
        if key.startswith("company_"):
            cat = "company"
        elif key in ["exchange_rate", "dependent_rebate", "nssf_ceiling"]:
            cat = "payroll"
        elif "ai" in key:
            cat = "ai"
        else:
            cat = "general"

        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            old_snapshot[key] = setting.value
            setting.value = val
            setting.category = cat
        else:
            old_snapshot[key] = None
            setting = SystemSetting(
                category=cat,
                key=key,
                value=val,
                description=f"System setting for {key}",
            )
            db.add(setting)
        new_snapshot[key] = val

    db.commit()

    AuditService.log_event(
        db=db,
        action="UPDATE_SETTINGS",
        module="system",
        entity_type="SystemSetting",
        entity_id="global",
        user_id=current_user.id,
        old_values=old_snapshot,
        new_values=new_snapshot,
    )

    return APIResponse(data=new_snapshot, message="System settings updated successfully")
