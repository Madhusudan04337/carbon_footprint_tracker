from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
import time
from typing import Dict, Tuple

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_limit: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        # Maps client_ip -> (request_count, window_start_time)
        self.clients: Dict[str, Tuple[int, float]] = {}

    async def dispatch(self, request: Request, call_next) -> Response:
        client_ip = request.client.host if request.client else "unknown-ip"
        current_time = time.time()
        
        if client_ip not in self.clients:
            self.clients[client_ip] = (1, current_time)
        else:
            count, start_time = self.clients[client_ip]
            
            # Reset window if elapsed
            if current_time - start_time > self.window_seconds:
                self.clients[client_ip] = (1, current_time)
            else:
                if count >= self.requests_limit:
                    return Response(
                        content="Rate limit exceeded. Too many requests, please slow down.",
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS
                    )
                self.clients[client_ip] = (count + 1, start_time)
                
        response = await call_next(request)
        return response
