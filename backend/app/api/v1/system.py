import io
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_permission
from app.models.system import AuditLog, SystemSetting
from app.schemas.common import APIResponse, PaginatedResponse
from app.services.audit_service import AuditService
from app.services.backup_service import BackupService

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


@router.get("/backup/excel")
def export_backup_excel(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("system:configure")),
):
    """
    Exports a comprehensive multi-sheet Microsoft Excel (.xlsx) backup of the entire HRMS database.
    Includes Employees, Departments, Positions, Attendance, Leave, Payroll, Audit Logs, and Settings.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    excel_bytes = BackupService.generate_excel_backup(db)

    AuditService.log_event(
        db=db,
        action="EXPORT_BACKUP_EXCEL",
        module="system",
        entity_type="SystemBackup",
        entity_id="excel",
        user_id=current_user.id,
        new_values={"format": "xlsx", "timestamp": timestamp},
    )

    filename = f"a_plus_hrms_full_backup_{timestamp}.xlsx"
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.get("/backup/csv")
def export_backup_csv(
    table: Optional[str] = Query(None, description="Specific table name or 'all' for complete ZIP archive"),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("system:configure")),
):
    """
    Exports HRMS system data in RFC-4180 CSV format with UTF-8 BOM encoding for seamless Khmer Unicode display.
    If 'table' is specified (e.g. employees, attendance, leave, payroll, departments, positions, audit_logs, settings),
    returns an individual .csv file. Otherwise (or if table='all'), returns a compressed .zip archive of all tables.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if table and table.lower() != "all":
        tbl_clean = table.lower().strip()
        csv_text = BackupService.generate_csv_data(db, tbl_clean)
        csv_bytes = csv_text.encode("utf-8-sig")
        filename = f"a_plus_hrms_{tbl_clean}_{timestamp}.csv"

        AuditService.log_event(
            db=db,
            action="EXPORT_BACKUP_CSV_TABLE",
            module="system",
            entity_type="SystemBackup",
            entity_id=tbl_clean,
            user_id=current_user.id,
            new_values={"format": "csv", "table": tbl_clean, "timestamp": timestamp},
        )

        return StreamingResponse(
            io.BytesIO(csv_bytes),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    else:
        zip_bytes = BackupService.generate_csv_zip_backup(db)
        filename = f"a_plus_hrms_full_backup_csv_{timestamp}.zip"

        AuditService.log_event(
            db=db,
            action="EXPORT_BACKUP_CSV_ZIP",
            module="system",
            entity_type="SystemBackup",
            entity_id="zip_archive",
            user_id=current_user.id,
            new_values={"format": "zip", "timestamp": timestamp},
        )

        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
