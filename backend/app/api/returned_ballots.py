from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_tenant_user, tenant_scope
from app.models.models import ReturnedBallotStatus, User
from app.schemas.mappers import returned_ballot_to_list_item, returned_ballot_to_out
from app.schemas.schemas import (
    MatchVoterRequest,
    ReturnedBallotCreate,
    ReturnedBallotListItem,
    ReturnedBallotOut,
    ReturnedBallotRejectRequest,
    VerifyBallotRequest,
)
from app.services.returned_ballot_service import ReturnedBallotService

router = APIRouter(prefix="/api/returned-ballots", tags=["returned-ballots"], dependencies=[Depends(require_tenant_user)])


def get_returned_ballot_service(db: Session = Depends(get_db)) -> ReturnedBallotService:
    return ReturnedBallotService(db)


@router.get("", response_model=list[ReturnedBallotListItem])
def list_returned_ballots(
    view: str = Query("pending", pattern="^(pending|processed)$"),
    status_filter: ReturnedBallotStatus | None = Query(None, alias="status"),
    limit: int = Query(100, le=500),
    user: User = Depends(require_tenant_user),
    service: ReturnedBallotService = Depends(get_returned_ballot_service),
):
    ballots = service.list_ballots(tenant_scope(user), view=view, status_filter=status_filter, limit=limit)
    return [returned_ballot_to_list_item(b) for b in ballots]


@router.get("/{ballot_id}", response_model=ReturnedBallotOut)
def get_returned_ballot(
    ballot_id: int, user: User = Depends(require_tenant_user), service: ReturnedBallotService = Depends(get_returned_ballot_service)
):
    return returned_ballot_to_out(service.get_ballot(tenant_scope(user), ballot_id))


@router.post("", response_model=ReturnedBallotOut, status_code=201)
def create_returned_ballot(
    payload: ReturnedBallotCreate,
    user: User = Depends(require_tenant_user),
    service: ReturnedBallotService = Depends(get_returned_ballot_service),
):
    return returned_ballot_to_out(service.create_manual(tenant_scope(user), user, payload))


@router.post("/scan", response_model=ReturnedBallotOut, status_code=201)
async def create_returned_ballot_from_scan(
    file: UploadFile = File(...),
    user: User = Depends(require_tenant_user),
    service: ReturnedBallotService = Depends(get_returned_ballot_service),
):
    content = await file.read()
    ballot = await service.create_from_scan(tenant_scope(user), user, file.filename or "envelope.png", content)
    return returned_ballot_to_out(ballot)


@router.get("/{ballot_id}/envelope-image")
def get_envelope_image(
    ballot_id: int, user: User = Depends(require_tenant_user), service: ReturnedBallotService = Depends(get_returned_ballot_service)
):
    path = service.get_envelope_image_path(tenant_scope(user), ballot_id)
    return FileResponse(path)


@router.post("/{ballot_id}/match-voter", response_model=ReturnedBallotOut)
def match_voter(
    ballot_id: int,
    payload: MatchVoterRequest,
    user: User = Depends(require_tenant_user),
    service: ReturnedBallotService = Depends(get_returned_ballot_service),
):
    return returned_ballot_to_out(service.match_voter(tenant_scope(user), user, ballot_id, payload.voter_id))


@router.post("/{ballot_id}/verify", response_model=ReturnedBallotOut)
def verify_returned_ballot(
    ballot_id: int,
    payload: VerifyBallotRequest,
    user: User = Depends(require_tenant_user),
    service: ReturnedBallotService = Depends(get_returned_ballot_service),
):
    return returned_ballot_to_out(service.verify(tenant_scope(user), user, ballot_id, payload.verification_checklist))


@router.post("/{ballot_id}/reject", response_model=ReturnedBallotOut)
def reject_returned_ballot(
    ballot_id: int,
    payload: ReturnedBallotRejectRequest,
    user: User = Depends(require_tenant_user),
    service: ReturnedBallotService = Depends(get_returned_ballot_service),
):
    return returned_ballot_to_out(service.reject(tenant_scope(user), user, ballot_id, payload.reason))
