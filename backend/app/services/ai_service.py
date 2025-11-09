import openai
import httpx
import json
import redis
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from app.core.config import settings
from app.schemas import WeatherData, IrrigationScheduleResponse
from app.services.weather_service import weather_service

class AIRecommendationService:
    def __init__(self):
        self.openai_api_key = settings.openai_api_key
        self.openai_model = settings.openai_model
        self.cohere_api_key = settings.cohere_api_key
        self.gemini_api_key = settings.gemini_api_key
        self.redis_client = redis.from_url(settings.redis_url, decode_responses=True)
        self.cache_duration = 12 * 3600  # 12 hours
    
    def _get_cache_key(self, farm_data: Dict, weather_summary: str) -> str:
        """Generate cache key for AI recommendations"""
        farm_str = f"{farm_data['crop_type']}_{farm_data['land_size']}_{farm_data['latitude']}_{farm_data['longitude']}"
        return f"ai_recommendation:{farm_str}:{hash(weather_summary)}"
    
    def _create_prompt(self, farm_data: Dict, weather_data: List[WeatherData]) -> str:
        """Create prompt for AI recommendation"""
        crop_type = farm_data['crop_type']
        land_size = farm_data['land_size']
        soil_type = farm_data.get('soil_type', 'unknown')
        location = f"lat {farm_data['latitude']}, lon {farm_data['longitude']}"
        
        # Summarize weather data
        weather_summary = []
        for i, weather in enumerate(weather_data[:7]):  # Next 7 days
            date = (datetime.utcnow() + timedelta(days=i)).strftime("%Y-%m-%d")
            weather_summary.append(
                f"Day {i+1} ({date}): {weather.temperature}°C, "
                f"{weather.humidity}% humidity, {weather.precipitation}mm rain, "
                f"{weather.description}"
            )
        
        prompt = f"""
You are an expert agricultural advisor specializing in African smallholder farming. 
Provide irrigation recommendations for the following farm:

FARM DETAILS:
- Crop: {crop_type}
- Land size: {land_size} acres
- Location: {location}
- Soil type: {soil_type}

WEATHER FORECAST (next 7 days):
{chr(10).join(weather_summary)}

Please provide irrigation recommendations for the next 7 days in the following JSON format:
{{
    "recommendations": [
        {{
            "date": "YYYY-MM-DD",
            "irrigate": true/false,
            "water_amount_liters": number,
            "reasoning": "explanation for the recommendation"
        }}
    ],
    "general_advice": "Overall irrigation strategy and tips"
}}

Consider:
1. Crop water requirements for {crop_type}
2. Soil moisture from recent rainfall
3. Temperature and humidity effects on evapotranspiration
4. Water conservation for smallholder farmers
5. Local growing conditions in East Africa

Respond ONLY with valid JSON.
"""
        return prompt
    
    async def _call_openai_api(self, prompt: str) -> Optional[Dict]:
        """Call OpenAI API for recommendations"""
        if not self.openai_api_key:
            return None
        
        try:
            openai.api_key = self.openai_api_key
            response = await openai.ChatCompletion.acreate(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": "You are an expert agricultural advisor."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            content = response.choices[0].message.content.strip()
            return json.loads(content)
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return None
    
    async def _call_cohere_api(self, prompt: str) -> Optional[Dict]:
        """Call Cohere API for recommendations"""
        if not self.cohere_api_key:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.cohere.ai/v1/generate",
                    headers={
                        "Authorization": f"Bearer {self.cohere_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "command",
                        "prompt": prompt,
                        "max_tokens": 1500,
                        "temperature": 0.3
                    }
                )
                response.raise_for_status()
                data = response.json()
                content = data["generations"][0]["text"].strip()
                return json.loads(content)
        except Exception as e:
            print(f"Cohere API error: {e}")
            return None
    
    async def _call_gemini_api(self, prompt: str) -> Optional[Dict]:
        """Call Google Gemini API for recommendations"""
        if not self.gemini_api_key:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={self.gemini_api_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{
                            "parts": [{"text": prompt}]
                        }],
                        "generationConfig": {
                            "temperature": 0.3,
                            "maxOutputTokens": 1500
                        }
                    }
                )
                response.raise_for_status()
                data = response.json()
                content = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                return json.loads(content)
        except Exception as e:
            print(f"Gemini API error: {e}")
            return None
    
    def _validate_recommendations(self, recommendations: Dict) -> bool:
        """Validate AI recommendations for reasonableness"""
        if not isinstance(recommendations, dict):
            return False
        
        if "recommendations" not in recommendations:
            return False
        
        for rec in recommendations["recommendations"]:
            if not isinstance(rec, dict):
                return False
            
            required_fields = ["date", "irrigate", "water_amount_liters", "reasoning"]
            if not all(field in rec for field in required_fields):
                return False
            
            # Validate water amount (reasonable range for smallholder farms)
            water_amount = rec["water_amount_liters"]
            if water_amount < 0 or water_amount > 10000:  # 0 to 10,000 liters per day
                return False
        
        return True
    
    def _get_fallback_recommendations(self, farm_data: Dict, weather_data: List[WeatherData]) -> Dict:
        """Generate fallback recommendations when AI fails"""
        recommendations = []
        
        for i in range(7):
            date = (datetime.utcnow() + timedelta(days=i)).strftime("%Y-%m-%d")
            weather = weather_data[i] if i < len(weather_data) else weather_data[0]
            
            # Simple rule-based fallback logic
            should_irrigate = False
            water_amount = 0
            reasoning = "Fallback recommendation based on simple rules"
            
            # Basic irrigation logic
            if weather.precipitation < 5:  # Less than 5mm rain
                if weather.temperature > 25:  # Hot day
                    should_irrigate = True
                    water_amount = min(100 * farm_data['land_size'], 500)  # 100L per acre, max 500L
                    reasoning = "Low rainfall and high temperature - irrigation needed"
                elif weather.temperature > 20:
                    should_irrigate = True
                    water_amount = min(50 * farm_data['land_size'], 300)  # 50L per acre, max 300L
                    reasoning = "Low rainfall and moderate temperature - light irrigation"
            else:
                reasoning = "Adequate rainfall - no irrigation needed"
            
            recommendations.append({
                "date": date,
                "irrigate": should_irrigate,
                "water_amount_liters": int(water_amount),
                "reasoning": reasoning
            })
        
        return {
            "recommendations": recommendations,
            "general_advice": "Basic irrigation schedule based on weather conditions. Monitor soil moisture and adjust as needed."
        }
    
    async def generate_irrigation_recommendations(self, farm_data: Dict) -> Dict:
        """Generate AI-powered irrigation recommendations"""
        # Get weather forecast
        lat, lon = farm_data['latitude'], farm_data['longitude']
        forecast = await weather_service.get_forecast(lat, lon)
        
        if not forecast:
            return self._get_fallback_recommendations(farm_data, [])
        
        weather_data = [forecast.current] + forecast.forecast[:6]  # Current + 6 days
        weather_summary = json.dumps([w.model_dump(mode='json') for w in weather_data])
        
        # Check cache
        cache_key = self._get_cache_key(farm_data, weather_summary)
        try:
            cached_result = self.redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
        except Exception as e:
            print(f"Cache error: {e}")
        
        # Create prompt
        prompt = self._create_prompt(farm_data, weather_data)
        
        # Try AI APIs in order of preference
        result = None
        
        # Try OpenAI first
        if self.openai_api_key:
            result = await self._call_openai_api(prompt)
        
        # Fallback to Cohere
        if not result and self.cohere_api_key:
            result = await self._call_cohere_api(prompt)
        
        # Fallback to Gemini
        if not result and self.gemini_api_key:
            result = await self._call_gemini_api(prompt)
        
        # Validate result
        if result and self._validate_recommendations(result):
            # Cache the result
            try:
                self.redis_client.setex(cache_key, self.cache_duration, json.dumps(result))
            except Exception as e:
                print(f"Cache set error: {e}")
            return result
        
        # Use fallback if all AI APIs fail
        return self._get_fallback_recommendations(farm_data, weather_data)


# Singleton instance
ai_recommendation_service = AIRecommendationService()
