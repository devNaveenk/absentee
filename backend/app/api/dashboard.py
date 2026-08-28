from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_tenant_user, tenant_scope
from app.models.models import User
from app.schemas.schemas import DashboardSummary
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(require_tenant_user)])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(user: User = Depends(require_tenant_user), db: Session = Depends(get_db)):
    return DashboardService(db).summary(tenant_scope(user))
