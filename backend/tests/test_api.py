import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "version" in data


def test_root_endpoint(client: TestClient):
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


def test_register_farmer(client: TestClient, sample_farmer_data):
    """Test farmer registration"""
    response = client.post("/api/auth/register", json=sample_farmer_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_farmer(client: TestClient, sample_farmer_data):
    """Test registration with duplicate phone number"""
    # Register first farmer
    client.post("/api/auth/register", json=sample_farmer_data)
    
    # Try to register again with same phone number
    response = client.post("/api/auth/register", json=sample_farmer_data)
    assert response.status_code == 400
    data = response.json()
    assert "already registered" in data["error"].lower()


def test_login_farmer(client: TestClient, sample_farmer_data):
    """Test farmer login"""
    # Register farmer first
    client.post("/api/auth/register", json=sample_farmer_data)
    
    # Login
    login_data = {
        "phone_number": sample_farmer_data["phone_number"],
        "password": sample_farmer_data["password"]
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_login_invalid_credentials(client: TestClient):
    """Test login with invalid credentials"""
    login_data = {
        "phone_number": "+250788999999",
        "password": "wrongpassword"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 401


def test_get_farmer_profile(client: TestClient, sample_farmer_data):
    """Test getting farmer profile"""
    # Register farmer
    register_response = client.post("/api/auth/register", json=sample_farmer_data)
    token = register_response.json()["access_token"]
    
    # Get profile
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/farmers/profile", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["phone_number"] == sample_farmer_data["phone_number"]
    assert data["name"] == sample_farmer_data["name"]


def test_create_farm(client: TestClient, sample_farmer_data, sample_farm_data):
    """Test creating a farm"""
    # Register farmer and get token
    register_response = client.post("/api/auth/register", json=sample_farmer_data)
    token = register_response.json()["access_token"]
    
    # Create farm
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/farms/", json=sample_farm_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["crop_type"] == sample_farm_data["crop_type"]
    assert data["land_size"] == sample_farm_data["land_size"]


def test_get_farms(client: TestClient, sample_farmer_data, sample_farm_data):
    """Test getting farms"""
    # Register farmer and get token
    register_response = client.post("/api/auth/register", json=sample_farmer_data)
    token = register_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create farm
    client.post("/api/farms/", json=sample_farm_data, headers=headers)
    
    # Get farms
    response = client.get("/api/farms/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["crop_type"] == sample_farm_data["crop_type"]


def test_unauthorized_access(client: TestClient):
    """Test unauthorized access to protected endpoints"""
    response = client.get("/api/farmers/profile")
    assert response.status_code == 403  # FastAPI returns 403 for missing auth


def test_invalid_token(client: TestClient):
    """Test access with invalid token"""
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/api/farmers/profile", headers=headers)
    assert response.status_code == 401
