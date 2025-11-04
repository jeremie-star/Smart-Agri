from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import time
import redis
from typing import Dict, Any

from app.core.config import settings

class RateLimiter:
    def __init__(self):
        self.redis_client = redis.from_url(settings.redis_url, decode_responses=True)
        self.requests_limit = settings.rate_limit_requests
        self.window_seconds = settings.rate_limit_window
    
    async def __call__(self, request: Request):
        # Get client IP
        client_ip = request.client.host
        
        # Create rate limit key
        key = f"rate_limit:{client_ip}"
        
        try:
            # Get current request count
            current_requests = self.redis_client.get(key)
            
            if current_requests is None:
                # First request in window
                self.redis_client.setex(key, self.window_seconds, 1)
            else:
                current_requests = int(current_requests)
                
                if current_requests >= self.requests_limit:
                    raise HTTPException(
                        status_code=429,
                        detail={
                            "error": "Rate limit exceeded",
                            "code": "RATE_LIMIT_EXCEEDED",
                            "details": {
                                "limit": self.requests_limit,
                                "window": self.window_seconds,
                                "retry_after": self.redis_client.ttl(key)
                            }
                        }
                    )
                
                # Increment counter
                self.redis_client.incr(key)
        
        except redis.RedisError:
            # If Redis is down, allow the request
            pass


# Rate limiter instance
rate_limiter = RateLimiter()


def create_error_response(error: str, code: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
    """Create standardized error response"""
    return {
        "error": error,
        "code": code,
        "details": details or {}
    }
