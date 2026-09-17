from fastapi import APIRouter
from app.api.v1 import auth, organization, employees, attendance, leave, payroll, system, recruitment, offboarding, reports, loans, talent, documents, ai

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organization.router, prefix="/organization", tags=["Organization"])
api_router.include_router(employees.router, prefix="/employees", tags=["Employees"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(leave.router, prefix="/leave", tags=["Leave"])
api_router.include_router(payroll.router, prefix="/payroll", tags=["Payroll Engine"])
api_router.include_router(recruitment.router, prefix="/recruitment", tags=["Recruitment & ATS"])
api_router.include_router(offboarding.router, prefix="/offboarding", tags=["Offboarding & Final Settlement"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Compliance"])
api_router.include_router(loans.router, prefix="/loans", tags=["Loans & Advances"])
api_router.include_router(talent.router, prefix="/talent", tags=["Talent & Performance"])
api_router.include_router(documents.router, prefix="/documents", tags=["Document Vault"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI HR Advisor"])
api_router.include_router(system.router, prefix="/system", tags=["System & Audit"])


