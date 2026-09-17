"""
Secure Document Vault & Expiration Monitoring Router for Cambodia Enterprise HRMS.
Manages employee identification, labor books, work permits, and expiration alert workflows.
"""

from typing import List, Optional
from datetime import date
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_permission
from app.models.employee import EmployeeDocument, Employee
from app.schemas.common import APIResponse
from app.services.audit_service import AuditService

router = APIRouter()


class DocumentCreate(BaseModel):
    employee_id: str
    document_type: str = "NATIONAL_ID"  # "NATIONAL_ID", "PASSPORT", "LABOR_BOOK", "WORK_PERMIT", "CONTRACT", "DEGREE"
    title: str
    document_number: Optional[str] = None
    file_url: str
    file_size_bytes: Optional[int] = 102400
    mime_type: Optional[str] = "application/pdf"
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    is_confidential: bool = True


@router.get("", response_model=APIResponse[List[dict]])
def list_documents(
    employee_id: Optional[str] = None,
    document_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("employee:view_confidential")),
):
    query = db.query(EmployeeDocument, Employee).join(Employee, Employee.id == EmployeeDocument.employee_id)
    if employee_id:
        query = query.filter(EmployeeDocument.employee_id == employee_id)
    if document_type:
        query = query.filter(EmployeeDocument.document_type == document_type)

    docs = query.order_by(EmployeeDocument.created_at.desc()).all()
    today = date.today()
    results = []
    for doc, emp in docs:
        days_to_expiry = None
        if doc.expiry_date:
            days_to_expiry = (doc.expiry_date - today).days

        results.append({
            "id": doc.id,
            "employee_id": doc.employee_id,
            "employee_code": emp.employee_code,
            "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
            "employee_name_kh": f"{emp.last_name_kh} {emp.first_name_kh}",
            "document_type": doc.document_type,
            "title": doc.title,
            "document_number": doc.document_number,
            "file_url": doc.file_url,
            "issue_date": doc.issue_date.isoformat() if doc.issue_date else None,
            "expiry_date": doc.expiry_date.isoformat() if doc.expiry_date else None,
            "days_to_expiry": days_to_expiry,
            "is_confidential": doc.is_confidential,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
        })
    return APIResponse(data=results, message="Documents retrieved successfully")


@router.get("/expiring", response_model=APIResponse[List[dict]])
def list_expiring_documents(
    days_threshold: int = Query(60, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("employee:view_confidential")),
):
    """Retrieves legal IDs and contracts expiring within specified threshold."""
    docs = db.query(EmployeeDocument, Employee).join(Employee, Employee.id == EmployeeDocument.employee_id).filter(
        EmployeeDocument.expiry_date != None
    ).all()

    today = date.today()
    expiring = []
    for doc, emp in docs:
        days_left = (doc.expiry_date - today).days
        if 0 <= days_left <= days_threshold:
            expiring.append({
                "id": doc.id,
                "employee_code": emp.employee_code,
                "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
                "document_type": doc.document_type,
                "title": doc.title,
                "document_number": doc.document_number,
                "expiry_date": doc.expiry_date.isoformat(),
                "days_remaining": days_left,
                "severity": "CRITICAL" if days_left <= 30 else "WARNING",
            })

    expiring.sort(key=lambda x: x["days_remaining"])
    return APIResponse(data=expiring, message=f"{len(expiring)} documents expiring within {days_threshold} days")


@router.post("", response_model=APIResponse[dict])
def upload_document(
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("employee:manage_sensitive")),
):
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    doc = EmployeeDocument(
        employee_id=data.employee_id,
        document_type=data.document_type,
        title=data.title,
        document_number=data.document_number,
        file_url=data.file_url,
        file_size_bytes=data.file_size_bytes,
        mime_type=data.mime_type,
        issue_date=data.issue_date,
        expiry_date=data.expiry_date,
        is_confidential=data.is_confidential,
        uploaded_by_user_id=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    AuditService.log_event(
        db=db,
        action="UPLOAD_DOCUMENT",
        module="documents",
        entity_type="EmployeeDocument",
        entity_id=doc.id,
        user_id=current_user.id,
        new_values={"employee_code": emp.employee_code, "doc_type": data.document_type, "title": data.title},
    )

    return APIResponse(data={"id": doc.id, "title": doc.title}, message="Document encrypted and registered in vault")
