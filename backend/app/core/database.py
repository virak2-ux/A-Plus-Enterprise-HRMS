import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("hrms.database")

# Try connecting to the primary DB, fallback to SQLite if needed and allowed
engine = None
try:
    if settings.DATABASE_URL.startswith("postgresql"):
        # Quick timeout test connection
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 1}
        )
        with engine.connect() as conn:
            pass
        logger.info("Successfully connected to primary PostgreSQL database.")
except Exception as e:
    if settings.USE_SQLITE_FALLBACK:
        logger.warning(
            f"PostgreSQL connection failed ({e}). Falling back to SQLite for local development/testing: {settings.SQLITE_FALLBACK_URL}"
        )
        engine = create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False},
        )
    else:
        raise e

if engine is None:
    engine = create_engine(
        settings.SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
