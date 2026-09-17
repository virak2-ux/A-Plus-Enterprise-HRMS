import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure test uses SQLite in memory or test db file
os.environ["DATABASE_URL"] = "sqlite:///./test_hrms.db"

from app.core.database import Base, get_db
from app.main import app
from scripts.seed_data import seed_database

test_engine = create_engine("sqlite:///./test_hrms.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    # Seed test database
    db = TestingSessionLocal()
    seed_database(db_session=db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def auth_headers(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin@cambodia-hrms.com", "password": "Admin@123456"}
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

