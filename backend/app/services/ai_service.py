from openai import AsyncOpenAI
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
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
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
        if not self.openai_client:
            return None
        
        try:
            response = await self.openai_client.chat.completions.create(
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
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{
                            "parts": [{"text": prompt}]
                        }],
                        "generationConfig": {
                            "temperature": 0.3,
                            "maxOutputTokens": 1500
                        }
                    },
                    timeout=30.0
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
    
    async def generate_chat_response(self, question: str, farmer_data: Dict, context_data: Dict = None) -> str:
        """Generate AI-powered chat response for farmer questions"""
        
        # Create context-aware prompt
        prompt = self._create_chat_prompt(question, farmer_data, context_data)
        
        # Try AI APIs in order of preference
        response = None
        
        # Try OpenAI first
        if self.openai_api_key:
            response = await self._call_openai_chat_api(prompt)
        
        # Fallback to Cohere
        if not response and self.cohere_api_key:
            response = await self._call_cohere_chat_api(prompt)
        
        # Fallback to Gemini
        if not response and self.gemini_api_key:
            response = await self._call_gemini_chat_api(prompt)
        
        # Use fallback if all AI APIs fail
        if not response:
            response = self._get_fallback_chat_response(question, farmer_data)
        
        return response
    
    def _create_chat_prompt(self, question: str, farmer_data: Dict, context_data: Dict = None) -> str:
        """Create context-aware prompt for chat responses"""
        
        # Base context about the farmer
        farmer_name = farmer_data.get('name', 'Farmer')
        language = farmer_data.get('language_preference', 'English')
        
        # Farm context if available
        farm_context = ""
        if context_data and context_data.get('farms'):
            farms = context_data['farms']
            farm_context = f"\nFarm Information:\n"
            for i, farm in enumerate(farms[:3], 1):  # Limit to 3 farms
                farm_context += f"- Farm {i}: {farm.get('crop_type', 'Unknown crop')} on {farm.get('land_size', 0)} acres\n"
        
        # Weather context if available
        weather_context = ""
        if context_data and context_data.get('weather'):
            weather = context_data['weather']
            weather_context = f"\nCurrent Weather:\n- Temperature: {weather.get('temperature', 'N/A')}°C\n- Humidity: {weather.get('humidity', 'N/A')}%\n- Precipitation: {weather.get('precipitation', 'N/A')}mm\n"
        
        prompt = f"""
You are an expert agricultural advisor specializing in African smallholder farming. 
You are helping {farmer_name}, a farmer who speaks {language}.

FARMER'S QUESTION: {question}
{farm_context}
{weather_context}

Please provide a helpful, practical response in {language}. Consider:
1. Local farming conditions in East Africa
2. Smallholder farmer constraints (limited resources, small plots)
3. Sustainable farming practices
4. Climate-appropriate advice
5. Cost-effective solutions

Keep your response conversational, practical, and under 500 words.
If the question is not related to farming, politely redirect to agricultural topics.

Respond in {language} language.
"""
        return prompt
    
    async def _call_openai_chat_api(self, prompt: str) -> Optional[str]:
        """Call OpenAI API for chat responses"""
        if not self.openai_client:
            return None
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": "You are an expert agricultural advisor for African smallholder farmers."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI Chat API error: {e}")
            return None
    
    async def _call_cohere_chat_api(self, prompt: str) -> Optional[str]:
        """Call Cohere API for chat responses"""
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
                        "max_tokens": 800,
                        "temperature": 0.7
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data["generations"][0]["text"].strip()
        except Exception as e:
            print(f"Cohere Chat API error: {e}")
            return None
    
    async def _call_gemini_chat_api(self, prompt: str) -> Optional[str]:
        """Call Google Gemini API for chat responses"""
        if not self.gemini_api_key:
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{
                            "parts": [{"text": prompt}]
                        }],
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 800
                        }
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            print(f"Gemini Chat API error: {e}")
            return None
    
    def _get_fallback_chat_response(self, question: str, farmer_data: Dict) -> str:
        """Generate fallback chat response when AI APIs fail"""
        language = farmer_data.get('language_preference', 'English')
        farmer_name = farmer_data.get('name', 'Farmer')
        
        # Simple keyword-based responses
        question_lower = question.lower()
        
        if any(word in question_lower for word in ['water', 'irrigation', 'irrigate']):
            if language == 'Swahili':
                return f"Hujambo {farmer_name}! Kuhusu umwagiliaji, ni muhimu kutazama hali ya hewa na ardhi. Mwagilie wakati mvua ni kidogo na joto ni kali. Tumia maji kwa busara."
            elif language == 'Kinyarwanda':
                return f"Muraho {farmer_name}! Ku bijyanye n'uhira, ni ngombwa kureba ikirere n'ubutaka. Hira iyo imvura ari nke kandi ubushyuhe bukabije. Koresha amazi mu buryo bwiza."
            else:
                return f"Hello {farmer_name}! For irrigation, consider weather conditions and soil moisture. Water when rainfall is low and temperatures are high. Use water efficiently."
        
        elif any(word in question_lower for word in ['fertilizer', 'nutrients', 'compost']):
            if language == 'Swahili':
                return f"Hujambo {farmer_name}! Kwa mbolea, tumia mbolea asili kama mbolea ya ng'ombe au komposti. Ni rahisi na bei nafuu kuliko kemikali."
            elif language == 'Kinyarwanda':
                return f"Muraho {farmer_name}! Ku bijyanye n'ifumbire, koresha ifumbire kamere nk'amafi y'inka cyangwa kompost. Byoroshye kandi bihenze kurusha imiti."
            else:
                return f"Hello {farmer_name}! For fertilizers, consider organic options like cow manure or compost. They're cost-effective and improve soil health."
        
        elif any(word in question_lower for word in ['pest', 'insects', 'disease']):
            if language == 'Swahili':
                return f"Hujambo {farmer_name}! Kwa wadudu na magonjwa, tumia njia za asili kama mazao ya mchanganyiko na dawa za mimea. Angalia mazao yako mara kwa mara."
            elif language == 'Kinyarwanda':
                return f"Muraho {farmer_name}! Ku bijyanye n'udukoko n'indwara, koresha uburyo busanzwe nk'ihuriro ry'ibihingwa n'imiti y'ibimera. Genzura ibihingwa byawe buri gihe."
            else:
                return f"Hello {farmer_name}! For pests and diseases, try natural methods like crop rotation and plant-based pesticides. Monitor your crops regularly."
        
        else:
            if language == 'Swahili':
                return f"Hujambo {farmer_name}! Nina furaha kukusaidia na maswali ya kilimo. Je, una swali maalum kuhusu mimea, maji, au udongo?"
            elif language == 'Kinyarwanda':
                return f"Muraho {farmer_name}! Nishimiye kukugufasha mu kibazo cy'ubuhinzi. Ufite ikibazo runaka ku bijyanye n'ibihingwa, amazi, cyangwa ubutaka?"
            else:
                return f"Hello {farmer_name}! I'm happy to help with your farming questions. Do you have specific questions about crops, water, or soil?"


# Singleton instance
ai_recommendation_service = AIRecommendationService()
