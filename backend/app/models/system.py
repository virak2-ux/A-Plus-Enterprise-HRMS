from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime, Text, JSON
from app.models.base import BaseModel


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)          # e.g., "CREATE", "UPDATE", "APPROVE", "LOCK"
    module = Column(String(50), nullable=False, index=True)          # e.g., "payroll", "employee", "auth"
    entity_type = Column(String(50), nullable=False, index=True)     # e.g., "Employee", "PayrollRun"
    entity_id = Column(String(50), nullable=True, index=True)
    
    old_values = Column(JSON, nullable=True)                         # Historical snapshot before modification
    new_values = Column(JSON, nullable=True)                         # New snapshot after modification
    
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)


class SystemSetting(BaseModel):
    __tablename__ = "system_settings"

    company_id = Column(String(36), ForeignKey("companies.id"), nullable=True, index=True)
    category = Column(String(50), nullable=False, index=True)       # e.g., "payroll", "localization", "ai", "security"
    key = Column(String(100), nullable=False, index=True)           # e.g., "tos_brackets", "nssf_ceiling"
    value = Column(JSON, nullable=False)
    description = Column(String(255), nullable=True)
    is_encrypted = Column(Boolean, default=False, nullable=False)


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    module = Column(String(50), nullable=True)
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
