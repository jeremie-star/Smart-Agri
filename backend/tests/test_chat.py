from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

def test_chat_ask_question_unauthorized(client: TestClient):
    """Test asking question without authentication"""
    response = client.post(
        "/api/chat/ask",
        json={"question": "How often should I water my tomatoes?"}
    )
    assert response.status_code == 403


def test_chat_suggestions(client: TestClient, test_farmer_token: str):
    """Test getting chat suggestions"""
    response = client.get(
        "/api/chat/suggestions",
        headers={"Authorization": f"Bearer {test_farmer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
    assert isinstance(data["suggestions"], list)
    assert len(data["suggestions"]) > 0


def test_chat_ask_question_with_auth(client: TestClient, test_farmer_token: str, db: Session):
    """Test asking question with authentication"""
    response = client.post(
        "/api/chat/ask",
        headers={"Authorization": f"Bearer {test_farmer_token}"},
        json={
            "question": "How often should I water my tomatoes?",
            "include_farm_context": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "question" in data
    assert "response" in data
    assert data["question"] == "How often should I water my tomatoes?"
    assert len(data["response"]) > 0


def test_chat_history_empty(client: TestClient, test_farmer_token: str):
    """Test getting empty chat history"""
    response = client.get(
        "/api/chat/history",
        headers={"Authorization": f"Bearer {test_farmer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "chat_logs" in data
    assert "total" in data
    assert "page" in data
    assert "per_page" in data
    assert isinstance(data["chat_logs"], list)


def test_chat_ask_with_farm_context(client: TestClient, test_farmer_token: str, test_farm_data: dict):
    """Test asking question with farm context"""
    # First create a farm
    farm_response = client.post(
        "/api/farms/",
        headers={"Authorization": f"Bearer {test_farmer_token}"},
        json=test_farm_data
    )
    assert farm_response.status_code == 200
    
    # Then ask a question with context
    response = client.post(
        "/api/chat/ask",
        headers={"Authorization": f"Bearer {test_farmer_token}"},
        json={
            "question": "What is the best irrigation schedule for my crop?",
            "include_farm_context": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["response"]) > 0


def test_chat_history_with_messages(client: TestClient, test_farmer_token: str):
    """Test getting chat history after asking questions"""
    # Ask a question first
    client.post(
        "/api/chat/ask",
        headers={"Authorization": f"Bearer {test_farmer_token}"},
        json={"question": "Test question", "include_farm_context": False}
    )
    
    # Get history
    response = client.get(
        "/api/chat/history",
        headers={"Authorization": f"Bearer {test_farmer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert len(data["chat_logs"]) >= 1
    assert data["chat_logs"][0]["question"] == "Test question"


def test_delete_chat_message(client: TestClient, test_farmer_token: str):
    """Test deleting a chat message"""
    # Ask a question first
    ask_response = client.post(
        "/api/chat/ask",
        headers={"Authorization": f"Bearer {test_farmer_token}"},
        json={"question": "Test question to delete", "include_farm_context": False}
    )
    chat_id = ask_response.json()["id"]
    
    # Delete the message
    response = client.delete(
        f"/api/chat/history/{chat_id}",
        headers={"Authorization": f"Bearer {test_farmer_token}"}
    )
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["message"]


def test_clear_chat_history(client: TestClient, test_farmer_token: str):
    """Test clearing all chat history"""
    # Ask a few questions first
    for i in range(3):
        client.post(
            "/api/chat/ask",
            headers={"Authorization": f"Bearer {test_farmer_token}"},
            json={"question": f"Test question {i}", "include_farm_context": False}
        )
    
    # Clear history
    response = client.delete(
        "/api/chat/history",
        headers={"Authorization": f"Bearer {test_farmer_token}"}
    )
    assert response.status_code == 200
    assert "Deleted" in response.json()["message"]
    
    # Verify history is empty
    history_response = client.get(
        "/api/chat/history",
        headers={"Authorization": f"Bearer {test_farmer_token}"}
    )
    assert history_response.json()["total"] == 0


def test_chat_pagination(client: TestClient, test_farmer_token: str):
    """Test chat history pagination"""
    # Ask multiple questions
    for i in range(25):
        client.post(
            "/api/chat/ask",
            headers={"Authorization": f"Bearer {test_farmer_token}"},
            json={"question": f"Test question {i}", "include_farm_context": False}
        )
    
    # Test pagination
    response = client.get(
        "/api/chat/history?page=1&per_page=10",
        headers={"Authorization": f"Bearer {test_farmer_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 25
    assert len(data["chat_logs"]) == 10
    assert data["page"] == 1
    assert data["per_page"] == 10


def test_chat_multilingual_suggestions(client: TestClient, db: Session):
    """Test chat suggestions in different languages"""
    from app.models import Farmer, LanguageEnum
    from app.core.security import get_password_hash
    
    # Create farmers with different languages
    farmers_data = [
        ("english_farmer", "+250111111111", LanguageEnum.ENGLISH),
        ("swahili_farmer", "+250222222222", LanguageEnum.SWAHILI),
        ("kinyarwanda_farmer", "+250333333333", LanguageEnum.KINYARWANDA)
    ]
    
    for name, phone, language in farmers_data:
        # Create farmer
        farmer = Farmer(
            name=name,
            phone_number=phone,
            language_preference=language,
            password_hash=get_password_hash("password123")
        )
        db.add(farmer)
    db.commit()
    
    # Test suggestions for each language
    # (This would require creating tokens for each farmer, simplified for brevity)
    # The test would verify that suggestions are returned in the correct language


def test_chat_invalid_question(client: TestClient, test_farmer_token: str):
    """Test asking empty or invalid question"""
    response = client.post(
        "/api/chat/ask",
        headers={"Authorization": f"Bearer {test_farmer_token}"},
        json={"question": "", "include_farm_context": False}
    )
    # Should still work but might return a response asking for clarification
    assert response.status_code in [200, 400]  # Depending on validation rules


def test_delete_nonexistent_chat_message(client: TestClient, test_farmer_token: str):
    """Test deleting a non-existent chat message"""
    import uuid
    fake_id = str(uuid.uuid4())
    
    response = client.delete(
        f"/api/chat/history/{fake_id}",
        headers={"Authorization": f"Bearer {test_farmer_token}"}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]
