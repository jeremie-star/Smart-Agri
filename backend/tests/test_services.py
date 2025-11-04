import pytest
from unittest.mock import Mock, patch
from app.services.weather_service import WeatherService
from app.services.ai_service import AIRecommendationService
from app.services.notification_service import NotificationService
from app.models import LanguageEnum


class TestWeatherService:
    @pytest.fixture
    def weather_service(self):
        return WeatherService()
    
    @patch('app.services.weather_service.httpx.AsyncClient')
    async def test_get_current_weather_success(self, mock_client, weather_service):
        """Test successful weather data retrieval"""
        mock_response = Mock()
        mock_response.json.return_value = {
            "main": {"temp": 25.0, "humidity": 60},
            "weather": [{"description": "clear sky"}],
            "wind": {"speed": 3.5}
        }
        mock_response.raise_for_status.return_value = None
        
        mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
        
        result = await weather_service.get_current_weather(-1.944, 30.061)
        
        assert result is not None
        assert result.temperature == 25.0
        assert result.humidity == 60
        assert "clear sky" in result.description
    
    async def test_get_fallback_weather(self, weather_service):
        """Test fallback weather data"""
        result = weather_service._get_fallback_weather()
        
        assert result.temperature == 25.0
        assert result.humidity == 60.0
        assert "fallback" in result.description.lower()


class TestAIRecommendationService:
    @pytest.fixture
    def ai_service(self):
        return AIRecommendationService()
    
    def test_create_prompt(self, ai_service):
        """Test AI prompt creation"""
        farm_data = {
            "crop_type": "Maize",
            "land_size": 2.0,
            "latitude": -1.944,
            "longitude": 30.061,
            "soil_type": "Clay"
        }
        
        weather_data = [Mock(
            temperature=25.0,
            humidity=60.0,
            precipitation=0.0,
            description="Clear sky"
        )]
        
        prompt = ai_service._create_prompt(farm_data, weather_data)
        
        assert "Maize" in prompt
        assert "2.0 acres" in prompt
        assert "Clay" in prompt
        assert "25.0°C" in prompt
    
    def test_validate_recommendations_valid(self, ai_service):
        """Test validation of valid recommendations"""
        recommendations = {
            "recommendations": [
                {
                    "date": "2024-01-01",
                    "irrigate": True,
                    "water_amount_liters": 500,
                    "reasoning": "Test reasoning"
                }
            ]
        }
        
        assert ai_service._validate_recommendations(recommendations) is True
    
    def test_validate_recommendations_invalid(self, ai_service):
        """Test validation of invalid recommendations"""
        recommendations = {
            "recommendations": [
                {
                    "date": "2024-01-01",
                    "irrigate": True,
                    "water_amount_liters": 50000,  # Too much water
                    "reasoning": "Test reasoning"
                }
            ]
        }
        
        assert ai_service._validate_recommendations(recommendations) is False


class TestNotificationService:
    @pytest.fixture
    def notification_service(self):
        return NotificationService()
    
    def test_translate_message_english(self, notification_service):
        """Test message translation for English"""
        message = "Irrigation Reminder: Water your crops"
        result = notification_service._translate_message(message, LanguageEnum.ENGLISH)
        assert result == message
    
    def test_translate_message_swahili(self, notification_service):
        """Test message translation for Swahili"""
        message = "Irrigation Reminder: Water your crop"
        result = notification_service._translate_message(message, LanguageEnum.SWAHILI)
        assert "Kikumbusho cha Umwagiliaji" in result
    
    def test_format_sms_message_short(self, notification_service):
        """Test SMS formatting for short messages"""
        message = "Short message"
        result = notification_service._format_sms_message(message)
        assert result == message
    
    def test_format_sms_message_long(self, notification_service):
        """Test SMS formatting for long messages"""
        message = "A" * 200  # 200 characters
        result = notification_service._format_sms_message(message)
        assert len(result) <= 160
        assert result.endswith("...")
    
    def test_create_irrigation_message(self, notification_service):
        """Test irrigation message creation"""
        message = notification_service.create_irrigation_message(
            crop_type="Maize",
            water_amount=500.0,
            weather_condition="Sunny",
            reasoning="Low rainfall expected"
        )
        
        assert "Maize" in message
        assert "500" in message
        assert "Sunny" in message
        assert "Low rainfall" in message
    
    def test_create_irrigation_email_html(self, notification_service):
        """Test HTML email creation"""
        html = notification_service.create_irrigation_email_html(
            farmer_name="John Doe",
            crop_type="Maize",
            water_amount=500.0,
            weather_condition="Sunny",
            reasoning="Low rainfall expected",
            farm_location="Test Location"
        )
        
        assert "<html>" in html
        assert "John Doe" in html
        assert "Maize" in html
        assert "500" in html
