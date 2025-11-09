import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from main import app
from app.core.database import get_db, Base
from app.core.config import settings

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
