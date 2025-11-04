import httpx
import redis
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.core.config import settings
from app.schemas import WeatherData, WeatherForecast

class WeatherService:
    def __init__(self):
        self.api_key = settings.openweather_api_key
        self.base_url = settings.openweather_base_url
        self.redis_client = redis.from_url(settings.redis_url, decode_responses=True)
        self.cache_duration = 6 * 3600  # 6 hours in seconds
    
    def _get_cache_key(self, lat: float, lon: float, forecast: bool = False) -> str:
        """Generate cache key for weather data"""
        cache_type = "forecast" if forecast else "current"
        return f"weather:{cache_type}:{lat}:{lon}"
    
    async def _fetch_from_api(self, endpoint: str, params: Dict[str, Any]) -> Optional[Dict]:
        """Fetch data from OpenWeatherMap API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/{endpoint}",
                    params=params,
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
        except httpx.RequestError as e:
            print(f"Weather API request error: {e}")
            return None
        except httpx.HTTPStatusError as e:
            print(f"Weather API HTTP error: {e}")
            return None
    
    def _parse_weather_data(self, data: Dict, timestamp: Optional[datetime] = None) -> WeatherData:
        """Parse OpenWeatherMap response to WeatherData"""
        main = data.get("main", {})
        weather = data.get("weather", [{}])[0]
        
        return WeatherData(
            temperature=main.get("temp", 0),
            humidity=main.get("humidity", 0),
            precipitation=data.get("rain", {}).get("1h", 0) + data.get("snow", {}).get("1h", 0),
            wind_speed=data.get("wind", {}).get("speed", 0),
            description=weather.get("description", ""),
            date=timestamp or datetime.utcnow()
        )
    
    async def get_current_weather(self, lat: float, lon: float) -> Optional[WeatherData]:
        """Get current weather for coordinates"""
        cache_key = self._get_cache_key(lat, lon)
        
        # Try to get from cache first
        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                data = json.loads(cached_data)
                return WeatherData(**data)
        except Exception as e:
            print(f"Cache error: {e}")
        
        # Fetch from API
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric"
        }
        
        data = await self._fetch_from_api("weather", params)
        if not data:
            return self._get_fallback_weather()
        
        weather_data = self._parse_weather_data(data)
        
        # Cache the result
        try:
            self.redis_client.setex(
                cache_key,
                self.cache_duration,
                weather_data.json()
            )
        except Exception as e:
            print(f"Cache set error: {e}")
        
        return weather_data
    
    async def get_forecast(self, lat: float, lon: float) -> Optional[WeatherForecast]:
        """Get 7-day weather forecast"""
        cache_key = self._get_cache_key(lat, lon, forecast=True)
        
        # Try to get from cache first
        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                data = json.loads(cached_data)
                return WeatherForecast(**data)
        except Exception as e:
            print(f"Cache error: {e}")
        
        # Get current weather
        current = await self.get_current_weather(lat, lon)
        if not current:
            return None
        
        # Fetch forecast from API
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric",
            "cnt": 56  # 7 days * 8 (3-hour intervals)
        }
        
        data = await self._fetch_from_api("forecast", params)
        if not data:
            return self._get_fallback_forecast(current)
        
        # Parse forecast data
        forecast_list = []
        for item in data.get("list", []):
            dt = datetime.fromtimestamp(item["dt"])
            weather_data = self._parse_weather_data(item, dt)
            forecast_list.append(weather_data)
        
        forecast = WeatherForecast(current=current, forecast=forecast_list)
        
        # Cache the result
        try:
            self.redis_client.setex(
                cache_key,
                self.cache_duration,
                forecast.json()
            )
        except Exception as e:
            print(f"Cache set error: {e}")
        
        return forecast
    
    def _get_fallback_weather(self) -> WeatherData:
        """Return fallback weather data when API fails"""
        return WeatherData(
            temperature=25.0,
            humidity=60.0,
            precipitation=0.0,
            wind_speed=5.0,
            description="Clear sky (fallback)",
            date=datetime.utcnow()
        )
    
    def _get_fallback_forecast(self, current: WeatherData) -> WeatherForecast:
        """Return fallback forecast when API fails"""
        forecast_list = []
        for i in range(7):
            date = datetime.utcnow() + timedelta(days=i)
            forecast_list.append(WeatherData(
                temperature=current.temperature + (i * 0.5),  # Slight variation
                humidity=current.humidity,
                precipitation=0.0,
                wind_speed=current.wind_speed,
                description=f"Forecast day {i+1} (fallback)",
                date=date
            ))
        
        return WeatherForecast(current=current, forecast=forecast_list)


# Singleton instance
weather_service = WeatherService()
