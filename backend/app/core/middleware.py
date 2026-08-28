import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.models import RateLimitConfig, UsageLog
from app.services.rate_limiter import rate_limiter

EXEMPT_PREFIXES = ("/api/auth", "/docs", "/openapi.json", "/redoc", "/health")


class UsageAndRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        tenant_id: int | None = None
        user_id: int | None = None
        was_rate_limited = False

        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            payload = decode_access_token(auth_header.split(" ", 1)[1])
            if payload:
                user_id = int(payload["sub"]) if payload.get("sub") else None
                tenant_id = payload.get("tenant_id")

        if tenant_id is not None and not request.url.path.startswith(EXEMPT_PREFIXES):
            with SessionLocal() as db:
                config = db.query(RateLimitConfig).filter(RateLimitConfig.tenant_id == tenant_id).first()
                capacity = config.requests_per_minute if config else None
            if not rate_limiter.check(tenant_id, capacity):
                was_rate_limited = True
                duration_ms = int((time.perf_counter() - start) * 1000)
                self._log(tenant_id, user_id, request, 429, duration_ms, True)
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Please slow down."},
                )

        response = await call_next(request)
        duration_ms = int((time.perf_counter() - start) * 1000)

        if not request.url.path.startswith(("/docs", "/openapi.json", "/redoc", "/health")):
            self._log(tenant_id, user_id, request, response.status_code, duration_ms, was_rate_limited)

        return response

    @staticmethod
    def _log(tenant_id, user_id, request: Request, status_code: int, duration_ms: int, was_rate_limited: bool):
        try:
            with SessionLocal() as db:
                db.add(
                    UsageLog(
                        tenant_id=tenant_id,
                        user_id=user_id,
                        method=request.method,
                        path=request.url.path,
                        status_code=status_code,
                        duration_ms=duration_ms,
                        was_rate_limited=was_rate_limited,
                    )
                )
                db.commit()
        except Exception:
            pass
