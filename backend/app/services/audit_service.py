import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.system import AuditLog


class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        module: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        user_id: Optional[str] = None,
        old_values: Optional[Any] = None,
        new_values: Optional[Any] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Records an immutable audit trail entry."""
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return audit_entry
