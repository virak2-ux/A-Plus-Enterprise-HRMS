from typing import List, Optional
from datetime import date, datetime, timezone
import uuid
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_permission
from app.models.talent import DisciplinaryRecord
from app.models.employee import Employee
from app.schemas.common import APIResponse
from app.services.audit_service import AuditService

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class DisciplinaryActionCreate(BaseModel):
    employee_id: str
    incident_date: date
    category: str = Field(..., description="LATENESS, INSUBORDINATION, POLICY_BREACH, MISCONDUCT, SAFETY_VIOLATION, UNEXCUSED_ABSENCE")
    description: str
    action_taken: str = Field(..., description="VERBAL_WARNING, FIRST_WRITTEN_WARNING, SECOND_WRITTEN_WARNING, FINAL_WARNING, SUSPENSION, TERMINATION")
    suspension_days: int = 0
    improvement_plan: Optional[str] = None
    evidence_url: Optional[str] = None
    is_confidential: bool = True


class DisciplinaryAcknowledge(BaseModel):
    employee_comments: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=APIResponse[List[dict]])
def list_disciplinary_records(
    employee_id: Optional[str] = None,
    category: Optional[str] = None,
    action_taken: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("employee:read")),
):
    """Lists disciplinary records and warning letters."""
    query = db.query(DisciplinaryRecord, Employee).join(Employee, DisciplinaryRecord.employee_id == Employee.id)
    if employee_id:
        query = query.filter(DisciplinaryRecord.employee_id == employee_id)
    if category:
        query = query.filter(DisciplinaryRecord.category == category)
    if action_taken:
        query = query.filter(DisciplinaryRecord.action_taken == action_taken)

    records = query.order_by(DisciplinaryRecord.incident_date.desc()).all()
    results = []
    for disc, emp in records:
        results.append({
            "id": disc.id,
            "employee_id": disc.employee_id,
            "employee_code": emp.employee_code,
            "employee_name": f"{emp.first_name_en} {emp.last_name_en}",
            "employee_name_kh": f"{emp.last_name_kh} {emp.first_name_kh}",
            "department_id": emp.department_id,
            "incident_date": disc.incident_date.isoformat(),
            "category": disc.category,
            "description": disc.description,
            "action_taken": disc.action_taken,
            "warning_letter_number": disc.warning_letter_number,
            "suspension_days": disc.suspension_days,
            "improvement_plan": disc.improvement_plan,
            "acknowledged_by_employee": disc.acknowledged_by_employee,
            "acknowledged_at": disc.acknowledged_at.isoformat() if disc.acknowledged_at else None,
            "employee_comments": disc.employee_comments,
            "created_at": disc.created_at.isoformat() if disc.created_at else None,
        })
    return APIResponse(data=results, message=f"Retrieved {len(results)} disciplinary records")


@router.post("", response_model=APIResponse[dict])
def issue_disciplinary_action(
    data: DisciplinaryActionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("employee:write")),
):
    """Issues a progressive disciplinary action and warning letter."""
    emp = db.query(Employee).filter(Employee.id == data.employee_id, Employee.is_deleted == False).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Strict Cambodia Labor Law Article 27 Compliance: Suspension cannot exceed 7 days
    if data.action_taken == "SUSPENSION" and data.suspension_days > 7:
        raise HTTPException(
            status_code=400,
            detail="Cambodia Labor Law Article 27 stipulates that disciplinary suspension without pay shall not exceed 7 days.",
        )

    # Auto-generate Warning Letter reference number
    wl_ref = f"WL-{data.incident_date.year}-{str(uuid.uuid4())[:6].upper()}"

    record = DisciplinaryRecord(
        employee_id=emp.id,
        incident_date=data.incident_date,
        category=data.category,
        description=data.description,
        action_taken=data.action_taken,
        warning_letter_number=wl_ref,
        suspension_days=data.suspension_days if data.action_taken == "SUSPENSION" else 0,
        improvement_plan=data.improvement_plan,
        evidence_url=data.evidence_url,
        is_confidential=data.is_confidential,
        recorded_by_user_id=current_user.id,
    )
    db.add(record)
    db.flush()

    AuditService.log_event(
        db=db,
        action=f"DISCIPLINARY_{data.action_taken}",
        module="employee",
        entity_type="DisciplinaryRecord",
        entity_id=record.id,
        user_id=current_user.id,
        new_values={
            "employee_code": emp.employee_code,
            "action_taken": data.action_taken,
            "category": data.category,
            "warning_letter_number": wl_ref,
        },
    )
    db.commit()
    db.refresh(record)

    return APIResponse(
        data={
            "id": record.id,
            "warning_letter_number": record.warning_letter_number,
            "employee_id": record.employee_id,
            "action_taken": record.action_taken,
            "suspension_days": record.suspension_days,
            "incident_date": record.incident_date.isoformat(),
        },
        message="Disciplinary record issued successfully",
    )


@router.put("/{record_id}/acknowledge", response_model=APIResponse[dict])
def acknowledge_disciplinary_action(
    record_id: str,
    data: DisciplinaryAcknowledge,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("employee:read")),
):
    """Marks that the employee has acknowledged and signed the disciplinary action."""
    record = db.query(DisciplinaryRecord).filter(DisciplinaryRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Disciplinary record not found")

    record.acknowledged_by_employee = True
    record.acknowledged_at = datetime.now(timezone.utc)
    if data.employee_comments:
        record.employee_comments = data.employee_comments

    AuditService.log_event(
        db=db,
        action="ACKNOWLEDGE_DISCIPLINARY",
        module="employee",
        entity_type="DisciplinaryRecord",
        entity_id=record.id,
        user_id=current_user.id,
        new_values={"acknowledged_at": record.acknowledged_at.isoformat()},
    )
    db.commit()

    return APIResponse(
        data={"id": record.id, "acknowledged": True, "acknowledged_at": record.acknowledged_at.isoformat()},
        message="Disciplinary action acknowledged successfully",
    )


@router.get("/{record_id}/warning-letter", response_class=HTMLResponse)
def get_warning_letter_html(
    record_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("employee:read")),
):
    """Generates official printable Cambodian Bilingual Warning Letter HTML."""
    record = db.query(DisciplinaryRecord).filter(DisciplinaryRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Disciplinary record not found")
    emp = record.employee

    action_titles = {
        "VERBAL_WARNING": ("ការព្រមានដោយផ្ទាល់មាត់", "Verbal Warning / Informal Counseling"),
        "FIRST_WRITTEN_WARNING": ("លិខិតព្រមានជាលាយលក្ខណ៍អក្សរលើកទី១", "First Written Warning Letter"),
        "SECOND_WRITTEN_WARNING": ("លិខិតព្រមានជាលាយលក្ខណ៍អក្សរលើកទី២", "Second Written Warning Letter"),
        "FINAL_WARNING": ("លិខិតព្រមានជាលាយលក្ខណ៍អក្សរលើកចុងក្រោយ", "Final Written Warning Letter"),
        "SUSPENSION": ("លិខិតព្យួរការងារដោយគ្មានប្រាក់ឈ្នួល", f"Disciplinary Suspension ({record.suspension_days} Days)"),
        "TERMINATION": ("លិខិតបញ្ចប់កិច្ចសន្យាការងារ", "Notice of Contract Termination"),
    }
    title_kh, title_en = action_titles.get(record.action_taken, ("លិខិតព្រមាន", "Warning Letter"))

    html = f"""<!DOCTYPE html>
<html lang="km">
<head>
<meta charset="UTF-8">
<title>Warning Letter - {record.warning_letter_number}</title>
<style>
  body {{ font-family: 'Khmer OS Siemreap', 'Kantumruy Pro', 'Arial', sans-serif; margin: 40px; color: #1e293b; line-height: 1.6; }}
  .header {{ text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 25px; }}
  .motto-kh {{ font-size: 16px; font-weight: bold; margin-bottom: 4px; }}
  .motto-en {{ font-size: 13px; font-weight: bold; letter-spacing: 1px; color: #475569; }}
  .title-block {{ text-align: center; margin: 25px 0; }}
  .title-kh {{ font-size: 20px; font-weight: bold; color: #b91c1c; margin-bottom: 4px; }}
  .title-en {{ font-size: 15px; font-weight: bold; color: #334155; }}
  .ref-no {{ font-size: 12px; color: #64748b; font-family: monospace; }}
  .info-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
  .info-table td {{ padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 13px; }}
  .info-label {{ background: #f8fafc; font-weight: bold; width: 25%; color: #334155; }}
  .section-title {{ font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 20px; margin-bottom: 8px; border-left: 4px solid #b91c1c; padding-left: 10px; }}
  .content-box {{ background: #fdf2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; font-size: 13px; margin-bottom: 15px; }}
  .statutory-alert {{ background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 6px; font-size: 12px; color: #1e40af; margin: 20px 0; }}
  .signatures {{ display: flex; justify-content: space-between; margin-top: 50px; page-break-inside: avoid; }}
  .sig-block {{ text-align: center; width: 30%; }}
  .sig-line {{ border-bottom: 1px solid #94a3b8; margin-top: 60px; margin-bottom: 8px; }}
  .sig-title {{ font-size: 12px; font-weight: bold; color: #334155; }}
  @media print {{ body {{ margin: 15mm; }} }}
</style>
</head>
<body>
  <div class="header">
    <div class="motto-kh">ព្រះរាជាណាចក្រកម្ពុជា</div>
    <div class="motto-kh">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
    <div class="motto-en">KINGDOM OF CAMBODIA &bull; NATION RELIGION KING</div>
  </div>

  <div class="title-block">
    <div class="title-kh">{title_kh}</div>
    <div class="title-en">{title_en}</div>
    <div class="ref-no">Ref / លេខយោង: {record.warning_letter_number} | Date / កាលបរិច្ឆេទ: {record.incident_date.isoformat()}</div>
  </div>

  <table class="info-table">
    <tr>
      <td class="info-label">ឈ្មោះបុគ្គលិក / Employee Name:</td>
      <td><strong>{emp.last_name_kh} {emp.first_name_kh}</strong> ({emp.first_name_en} {emp.last_name_en})</td>
      <td class="info-label">អត្តលេខ / Employee Code:</td>
      <td><strong>{emp.employee_code}</strong></td>
    </tr>
    <tr>
      <td class="info-label">កាលបរិច្ឆេទកើតហេតុ / Incident Date:</td>
      <td>{record.incident_date.isoformat()}</td>
      <td class="info-label">ប្រភេទកំហុស / Infraction Category:</td>
      <td><strong>{record.category.replace('_', ' ')}</strong></td>
    </tr>
  </table>

  <div class="section-title">១. ការពិពណ៌នាលម្អិតអំពីកំហុសឆ្គង / Description of Infraction</div>
  <div class="content-box">
    {record.description}
  </div>

  <div class="section-title">២. វិធានការកែតម្រូវ & ផែនការអនុវត្ត / Corrective Action & Improvement Plan</div>
  <div class="content-box" style="background: #f0fdf4; border-color: #bbf7d0; color: #166534;">
    {record.improvement_plan or "Employee is required to adhere strictly to internal work regulations and perform duties with due diligence."}
  </div>

  <div class="statutory-alert">
    <strong>មូលដ្ឋានច្បាប់ស្តីពីការងារនៃព្រះរាជាណាចក្រកម្ពុជា / Statutory Legal Grounding:</strong><br>
    This disciplinary action is enforced in accordance with <em>Cambodian Labor Law Articles 26-29</em> (Internal Regulations & Disciplinary Penalties), <em>Article 75</em> (Termination with Prior Notice), and <em>Article 83</em> (Dismissal for Serious Misconduct). Disciplinary suspensions are strictly limited to a statutory maximum of 7 days without pay per Article 27. Repeated infractions will lead to escalated sanctions up to contract termination.
  </div>

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-title">ហត្ថលេខាបុគ្គលិក<br>Employee Acknowledgment</div>
      <div class="sig-line"></div>
      <div style="font-size: 11px; color: #64748b;">Name: {emp.first_name_en} {emp.last_name_en}</div>
    </div>
    <div class="sig-block">
      <div class="sig-title">ប្រធានផ្នែកផ្ទាល់<br>Line Manager Signature</div>
      <div class="sig-line"></div>
      <div style="font-size: 11px; color: #64748b;">Department Supervisor</div>
    </div>
    <div class="sig-block">
      <div class="sig-title">នាយកដ្ឋានធនធានមនុស្ស<br>HR Director Approval</div>
      <div class="sig-line"></div>
      <div style="font-size: 11px; color: #64748b;">HR & Legal Compliance</div>
    </div>
  </div>
</body>
</html>"""
    return HTMLResponse(content=html)
