import threading
import time

from app.core.config import settings


class TokenBucket:
    __slots__ = ("capacity", "tokens", "refill_per_sec", "last_refill", "lock")

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.tokens = float(capacity)
        self.refill_per_sec = capacity / 60.0
        self.last_refill = time.monotonic()
        self.lock = threading.Lock()

    def set_capacity(self, capacity: int) -> None:
        with self.lock:
            self.capacity = capacity
            self.refill_per_sec = capacity / 60.0
            self.tokens = min(self.tokens, float(capacity))

    def try_consume(self) -> bool:
        with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.last_refill = now
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_per_sec)
            if self.tokens >= 1:
                self.tokens -= 1
                return True
            return False


class RateLimiterRegistry:
    """Per-tenant token bucket rate limiter, held in process memory.

    Suitable for a single backend instance. For multi-instance deployments,
    swap this for a Redis-backed token bucket (same interface) so limits are
    shared across processes.
    """

    def __init__(self):
        self._buckets: dict[int, TokenBucket] = {}
        self._lock = threading.Lock()

    def _get_bucket(self, tenant_id: int, capacity: int) -> TokenBucket:
        with self._lock:
            bucket = self._buckets.get(tenant_id)
            if bucket is None:
                bucket = TokenBucket(capacity)
                self._buckets[tenant_id] = bucket
            return bucket

    def check(self, tenant_id: int | None, capacity: int | None) -> bool:
        if tenant_id is None:
            return True
        bucket = self._get_bucket(tenant_id, capacity or settings.default_rate_limit_per_minute)
        return bucket.try_consume()

    def update_capacity(self, tenant_id: int, capacity: int) -> None:
        bucket = self._buckets.get(tenant_id)
        if bucket:
            bucket.set_capacity(capacity)


rate_limiter = RateLimiterRegistry()
