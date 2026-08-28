from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_tenant_user, tenant_scope
from app.models.models import ApplicationStatus, User
from app.schemas.mappers import application_to_list_item, application_to_out
from app.schemas.schemas import (
    ApplicationCreate,
    ApplicationListItem,
    ApplicationOut,
    ApplicationUpdate,
    ApproveRequest,
    CureRequest,
    MatchVoterRequest,
    RejectRequest,
)
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/api/applications", tags=["applications"], dependencies=[Depends(require_tenant_user)])


def get_application_service(db: Session = Depends(get_db)) -> ApplicationService:
    return ApplicationService(db)


@router.get("", response_model=list[ApplicationListItem])
def list_applications(
    view: str = Query("unprocessed", pattern="^(unprocessed|processed)$"),
    status_filter: ApplicationStatus | None = Query(None, alias="status"),
    reapproval_only: bool = False,
    limit: int = Query(100, le=500),
    user: User = Depends(require_tenant_user),
    service: ApplicationService = Depends(get_application_service),
):
    apps = service.list_applications(
        tenant_scope(user), view=view, status_filter=status_filter, reapproval_only=reapproval_only, limit=limit
    )
    return [application_to_list_item(a) for a in apps]


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: int, user: User = Depends(require_tenant_user), service: ApplicationService = Depends(get_application_service)
):
    return application_to_out(service.get_application(tenant_scope(user), application_id))


@router.post("", response_model=ApplicationOut, status_code=201)
def create_application(
    payload: ApplicationCreate, user: User = Depends(require_tenant_user), service: ApplicationService = Depends(get_application_service)
):
    return application_to_out(service.create_manual(tenant_scope(user), user, payload))


@router.post("/scan", response_model=ApplicationOut, status_code=201)
async def create_application_from_scan(
    file: UploadFile = File(...),
    user: User = Depends(require_tenant_user),
    service: ApplicationService = Depends(get_application_service),
):
    content = await file.read()
    app_ = await service.create_from_scan(tenant_scope(user), user, file.filename or "scan.png", content)
    return application_to_out(app_)


@router.get("/{application_id}/scan-image")
def get_scan_image(
    application_id: int, user: User = Depends(require_tenant_user), service: ApplicationService = Depends(get_application_service)
):
    path = service.get_scan_image_path(tenant_scope(user), application_id)
    return FileResponse(path)


@router.patch("/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: int,
    payload: ApplicationUpdate,
    user: User = Depends(require_tenant_user),
    service: ApplicationService = Depends(get_application_service),
):
    return application_to_out(service.update_fields(tenant_scope(user), user, application_id, payload))


@router.post("/{application_id}/match-voter", response_model=ApplicationOut)
def match_voter(
    application_id: int,
    payload: MatchVoterRequest,
    user: User = Depends(require_tenant_user),
    service: ApplicationService = Depends(get_application_service),
):
    return application_to_out(service.match_voter(tenant_scope(user), user, application_id, payload.voter_id))


@router.post("/{application_id}/approve", response_model=ApplicationOut)
def approve_application(
    application_id: int,
    payload: ApproveRequest,
    user: User = Depends(require_tenant_user),
    service: ApplicationService = Depends(get_application_service),
):
    return application_to_out(
        service.approve(tenant_scope(user), user, application_id, payload.verification_checklist)
    )


@router.post("/{application_id}/reject", response_model=ApplicationOut)
def reject_application(
    application_id: int,
    payload: RejectRequest,
    user: User = Depends(require_tenant_user),
    service: ApplicationService = Depends(get_application_service),
):
    return application_to_out(service.reject(tenant_scope(user), user, application_id, payload.reason))


@router.post("/{application_id}/cure", response_model=ApplicationOut)
def cure_application(
    application_id: int,
    payload: CureRequest,
    user: User = Depends(require_tenant_user),
    service: ApplicationService = Depends(get_application_service),
):
    return application_to_out(service.cure(tenant_scope(user), user, application_id, payload.reason, payload.notify_via))


@router.post("/{application_id}/reapply", response_model=ApplicationOut, status_code=201)
def reapply_application(
    application_id: int,
    payload: ApplicationCreate,
    user: User = Depends(require_tenant_user),
    service: ApplicationService = Depends(get_application_service),
):
    return application_to_out(service.reapply(tenant_scope(user), user, application_id, payload))
