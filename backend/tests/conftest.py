import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import os

from main import app
from app.core.database import get_db, Base
from app.core.config import settings

# Disable rate limiting for tests
os.environ["DISABLE_RATE_LIMITING"] = "true"

# Test database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Create test client"""
    with TestClient(app) as test_client:
        # Create the database tables
        Base.metadata.create_all(bind=engine)
        yield test_client
        # Drop the database tables
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
async def async_client():
    """Create async test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create the database tables
        Base.metadata.create_all(bind=engine)
        yield ac
        # Drop the database tables
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_farmer_data():
    """Sample farmer data for testing"""
    return {
        "phone_number": "+250788123456",
        "name": "John Uwimana",
        "language_preference": "English",
        "password": "testpassword123"
    }


@pytest.fixture
def sample_farm_data():
    """Sample farm data for testing"""
    return {
        "crop_type": "Maize",
        "land_size": 2.5,
        "latitude": -1.944,
        "longitude": 30.061,
        "soil_type": "Clay"
    }


@pytest.fixture
def db():
    """Create database session for testing"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_farmer_token(client: TestClient):
    """Create a test farmer and return authentication token"""
    import random
    # Use random phone number to avoid conflicts
    phone_number = f"+25078812{random.randint(1000, 9999)}"
    
    farmer_data = {
        "phone_number": phone_number,
        "name": "Test Farmer",
        "language_preference": "English", 
        "password": "testpassword123"
    }
    
    # Register farmer
    response = client.post("/api/auth/register", json=farmer_data)
    if response.status_code != 200:
        print(f"Registration failed: {response.status_code}, {response.json()}")
        raise Exception(f"Failed to register farmer: {response.json()}")
    
    return response.json()["access_token"]


@pytest.fixture
def test_farm_data(sample_farm_data: dict):
    """Return test farm data"""
    return sample_farm_data
