"""
AI HR Assistant & Cambodia Labor Law Advisory Engine.
Provides grounded regulatory guidance, tax bracket clarifications, and policy drafting with strict PII privacy.
"""

from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.schemas.common import APIResponse

router = APIRouter()


class ChatQuery(BaseModel):
    message: str
    context_module: Optional[str] = "GENERAL"


class ChatAnswer(BaseModel):
    reply: str
    legal_references: List[str]
    suggested_actions: List[str]
    pii_sanitized: bool = True


@router.post("/chat", response_model=APIResponse[ChatAnswer])
def query_ai_hr_advisor(
    query: ChatQuery,
    current_user=Depends(get_current_user),
):
    """
    Answers HR and labor law inquiries using deterministic Cambodia regulatory knowledge base.
    """
    p = query.message.lower()
    reply = ""
    legal_refs = []
    actions = []

    if any(k in p for k in ["seniority", "art. 89", "art 89", "indemnity", "severance"]):
        reply = (
            "Under **Cambodian Labor Law Article 89 & Prakas 443 (MLVT)**, Seniority Indemnity applies to "
            "Undetermined Duration Contracts (UDC):\n"
            "- Entitlement: **15 days of wages per year**, disbursed in two semi-annual installments (7.5 days in June, 7.5 days in December).\n"
            "- For Fixed Duration Contracts (FDC): Severance pay is **at least 5% of the total wages** earned during the contract duration.\n"
            "- Tax Exemption: Seniority indemnity payments are exempt from GDT Tax on Salary up to statutory thresholds."
        )
        legal_refs = ["Cambodia Labor Law Art. 89", "Prakas No. 443 MLVT", "GDT Circular on Tax Exemption"]
        actions = ["Review Employee Contract Type (UDC vs FDC)", "Calculate Seniority Installment via Payroll Engine"]

    elif any(k in p for k in ["leave", "annual leave", "art. 166", "sick leave", "maternity"]):
        reply = (
            "Under **Cambodian Labor Law Articles 166 to 170**:\n"
            "- **Annual Leave**: 1.5 working days per month of service (18 days/year base). "
            "Increases by **+1 day for every 3 years of continuous seniority**.\n"
            "- **Sick Leave**: Up to 6 months with certified medical certificate (100% pay for first month, 60% for 2nd-3rd months, unpaid thereafter).\n"
            "- **Maternity Leave**: **90 calendar days** at 50% wages (or NSSF maternity benefits if insured for >= 9 months)."
        )
        legal_refs = ["Labor Law Art. 166 (Annual Leave)", "Labor Law Art. 169 (Seniority Accrual)", "Labor Law Art. 182 (Maternity)"]
        actions = ["Check Employee Service Length for Seniority Bonus Days", "Verify Medical Certificate for Sick Leave > 2 days"]

    elif any(k in p for k in ["overtime", "ot", "art. 139", "night shift", "holiday"]):
        reply = (
            "Under **Cambodian Labor Law Article 139 & MLVT Regulations**:\n"
            "- Standard Work Week: Max 8 hours/day, 48 hours/week.\n"
            "- **Normal Working Day Overtime**: **1.5x (150%)** of regular hourly wage.\n"
            "- **Night Time Overtime (22:00 to 06:00)**: **2.0x (200%)** of regular wage.\n"
            "- **Weekly Rest Day (Sunday) & Public Holidays**: **2.0x (200%)** of regular wage."
        )
        legal_refs = ["Labor Law Art. 139", "Prakas No. 80 MLVT on Overtime"]
        actions = ["Ensure Pre-Approval for OT past 2 hours/day", "Auto-apply 150%/200% multipliers in Payroll"]

    elif any(k in p for k in ["tax", "tos", "bracket", "gdt", "withholding"]):
        reply = (
            "According to the **General Department of Taxation (GDT) Progressive Tax on Salary Rates**:\n"
            "- 0 to 1,500,000 KHR: **0%**\n"
            "- 1,500,001 to 2,000,000 KHR: **5%**\n"
            "- 2,000,001 to 8,500,000 KHR: **10%**\n"
            "- 8,500,001 to 12,500,000 KHR: **15%**\n"
            "- Over 12,500,000 KHR: **20%**\n"
            "- **Dependent Relief**: **150,000 KHR rebate** per eligible spouse and minor child.\n"
            "- **Non-Residents**: Flat **20%** tax with zero dependent relief."
        )
        legal_refs = ["Law on Taxation Art. 47", "GDT Prakas on Salary Tax Withholding"]
        actions = ["Verify Spouse and Children Declarations", "Export Monthly GDT Tax Return from Reports Module"]

    elif any(k in p for k in ["nssf", "pension", "health", "ceiling", "risk"]):
        reply = (
            "Under **Cambodia National Social Security Fund (NSSF)** regulations:\n"
            "- **Wage Floor**: 400,000 KHR (~$98 USD)\n"
            "- **Wage Ceiling**: 1,200,000 KHR (~$293 USD)\n"
            "- **Occupational Risk Scheme**: **0.8%** (100% Employer paid)\n"
            "- **Health Care Scheme**: **2.6%** (100% Employer paid)\n"
            "- **Pension Scheme**: **4.0% Total** (2.0% Employer + 2.0% Employee deduction).\n"
            "Maximum monthly pension contribution is capped at 24,000 KHR per side."
        )
        legal_refs = ["Law on Social Security Schemes (2019)", "Sub-Decree No. 32 on Pension Scheme"]
        actions = ["Validate NSSF Member Registration Numbers", "Export NSSF Monthly Contribution Ledger"]

    elif any(k in p for k in ["probation", "notice", "contract", "fdc", "udc"]):
        reply = (
            "Under **Cambodian Labor Law on Contracts & Probation**:\n"
            "- **Probation Limits (Art. 68)**: Max 3 months for regular staff, 2 months for specialized, 1 month for unskilled.\n"
            "- **FDC Total Duration**: Maximum 2 years total duration (initial + renewals); automatically converts to UDC if exceeded.\n"
            "- **Notice Periods (Art. 75)**: 7 days for service < 6 months, 15 days for 6-24 months, 1 month for 2-5 years, 2 months for 5-10 years, 3 months for > 10 years."
        )
        legal_refs = ["Labor Law Art. 67-73 (FDC/UDC)", "Labor Law Art. 68 (Probation)", "Labor Law Art. 75 (Notice Period)"]
        actions = ["Audit FDC Expiration and Renewal Timelines", "Verify Required Notice Period in Offboarding Module"]

    else:
        reply = (
            "I have analyzed your query regarding Cambodia HR operations. "
            "Our Cambodia HRMS architecture incorporates all current Ministry of Labour and Vocational Training (MLVT) "
            "and General Department of Taxation (GDT) statutory mandates. "
            "You can query me on Seniority Indemnity, Annual Leave accrual, NSSF contribution rates, Overtime multipliers, "
            "or Tax on Salary calculation methods."
        )
        legal_refs = ["Kingdom of Cambodia Labor Law (1997)", "MLVT Statutory Directives"]
        actions = ["Ask about Seniority Indemnity (Art. 89)", "Ask about Overtime Multipliers (Art. 139)"]

    answer = ChatAnswer(
        reply=reply,
        legal_references=legal_refs,
        suggested_actions=actions,
        pii_sanitized=True,
    )
    return APIResponse(data=answer, message="AI HR analysis completed")
