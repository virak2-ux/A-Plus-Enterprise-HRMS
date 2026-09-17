import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Boolean, String
from app.core.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class BaseModel(Base):
    __abstract__ = True

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = get_utc_now()
