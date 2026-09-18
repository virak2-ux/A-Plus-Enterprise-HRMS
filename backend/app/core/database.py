import os
import shutil
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("hrms.database")

# Check if running in serverless environment
is_serverless = os.getenv("VERCEL") is not None or os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None
is_local_db_url = "localhost" in settings.DATABASE_URL or "127.0.0.1" in settings.DATABASE_URL

# In serverless, if using SQLite fallback, copy pre-seeded database to /tmp if available
if is_serverless:
    tmp_db_path = "/tmp/cambodia_hrms.db"
    if not os.path.exists(tmp_db_path):
        candidates = [
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "cambodia_hrms.db"),
            "cambodia_hrms.db",
            "/vercel/path0/backend/cambodia_hrms.db",
        ]
        for candidate in candidates:
            if os.path.exists(candidate):
                try:
                    os.makedirs(os.path.dirname(tmp_db_path), exist_ok=True)
                    shutil.copyfile(candidate, tmp_db_path)
                    logger.info(f"Copied seeded database from {candidate} to {tmp_db_path}")
                    break
                except Exception as ex:
                    logger.warning(f"Could not copy {candidate} to {tmp_db_path}: {ex}")

engine = None

if is_serverless and is_local_db_url and settings.USE_SQLITE_FALLBACK:
    logger.info("Serverless environment detected with default localhost DB URL. Using SQLite fallback directly.")
    engine = create_engine(
        settings.SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False},
    )
else:
    try:
        if settings.DATABASE_URL.startswith("postgresql") and not (is_serverless and is_local_db_url):
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
