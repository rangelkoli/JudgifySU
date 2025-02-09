import asyncio
import time
from typing import Callable, Any
import functools

class RateLimiter:
    def __init__(self, calls_per_minute: int = 30):
        self.calls_per_minute = calls_per_minute
        self.interval = 60.0 / calls_per_minute
        self.last_call = 0
        self.lock = asyncio.Lock()

    async def wait(self):
        async with self.lock:
            current_time = time.time()
            time_since_last_call = current_time - self.last_call
            if time_since_last_call < self.interval:
                wait_time = self.interval - time_since_last_call
                await asyncio.sleep(wait_time)
            self.last_call = time.time()

def rate_limit(func: Callable) -> Callable:
    limiter = RateLimiter()
    
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        await limiter.wait()
        return await func(*args, **kwargs)
    
    return wrapper
