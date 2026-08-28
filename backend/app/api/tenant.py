from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_tenant_user
from app.models.models import User
from app.repositories.tenant_repository import TenantRepository
from app.schemas.mappers import tenant_to_my_summary
from app.schemas.schemas import MeResponse

router = APIRouter(prefix="/api/tenant", tags=["tenant"], dependencies=[Depends(require_tenant_user)])


@router.get("/me", response_model=MeResponse)
def get_my_tenant(user: User = Depends(require_tenant_user), db: Session = Depends(get_db)):
    if not user.tenant_id:
        return MeResponse(email=user.email, role=user.role, tenant=None)

    tenant = TenantRepository(db).get(user.tenant_id)
    return MeResponse(email=user.email, role=user.role, tenant=tenant_to_my_summary(tenant))
