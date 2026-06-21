import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import hashlib


from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.models.log import ActivityLog
from app.models.goal import Goal

# Create an in-memory SQLite database for fast unit/integration testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    # Setup test tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Teardown test tables
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    # Dependency override to inject test DB session
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def generate_safe_password(email: str) -> str:
    return "Pass-" + hashlib.sha256(email.encode()).hexdigest()[:12] + "!"

@pytest.fixture(scope="function")
def token_headers(client):
    test_email = "api_test_user@ecotrace.org"
    test_password = generate_safe_password(test_email)
    # Register user
    client.post("/api/auth/register", json={
        "email": test_email,
        "password": test_password,
        "first_name": "API",
        "last_name": "Tester",
        "country": "US",
        "postal_code": "10001"
    })
    # Login
    response = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


