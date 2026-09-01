from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import applications, auth, dashboard, returned_ballots, superadmin, tenant, tenant_settings, voters
from app.core.config import settings
from app.core.exceptions import DomainError
from app.core.middleware import UsageAndRateLimitMiddleware

app = FastAPI(title="BallotDA API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(UsageAndRateLimitMiddleware)


@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


app.include_router(auth.router)
app.include_router(superadmin.router)
app.include_router(tenant.router)
app.include_router(tenant_settings.router)
app.include_router(voters.router)
app.include_router(applications.router)
app.include_router(returned_ballots.router)
app.include_router(dashboard.router)


@app.get("/health")
def health():
    return {"status": "ok"}
