from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_tenant_user, tenant_scope
from app.core.exceptions import NotFoundError
from app.models.models import User
from app.repositories.voter_repository import VoterRepository
from app.schemas.mappers import voter_to_list_item, voter_to_out
from app.schemas.schemas import (
    VoterCreate,
    VoterImportSummary,
    VoterListPage,
    VoterOut,
    VoterSearchResult,
    VoterUpdate,
)
from app.services.storage import get_file_storage
from app.services.voter_service import VoterService

router = APIRouter(prefix="/api/voters", tags=["voters"], dependencies=[Depends(require_tenant_user)])


def get_voter_repository(db: Session = Depends(get_db)) -> VoterRepository:
    return VoterRepository(db)


def get_voter_service(db: Session = Depends(get_db)) -> VoterService:
    return VoterService(db)


@router.get("/search", response_model=list[VoterSearchResult])
def search_voters(
    q: str = Query(..., min_length=2),
    limit: int = Query(20, le=50),
    user: User = Depends(require_tenant_user),
    voters: VoterRepository = Depends(get_voter_repository),
):
    return voters.search(tenant_scope(user), q, limit)


@router.get("", response_model=VoterListPage)
def list_voters(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    user: User = Depends(require_tenant_user),
    service: VoterService = Depends(get_voter_service),
):
    tenant_id = tenant_scope(user)
    voters, total = service.list_voters(tenant_id, offset=offset, limit=limit)
    return VoterListPage(items=[voter_to_list_item(v) for v in voters], total=total, offset=offset, limit=limit)


@router.post("", response_model=VoterOut, status_code=201)
def create_voter(
    payload: VoterCreate, user: User = Depends(require_tenant_user), service: VoterService = Depends(get_voter_service)
):
    return voter_to_out(service.create_voter(tenant_scope(user), payload))


@router.post("/import-csv", response_model=VoterImportSummary)
async def import_voters_csv(
    file: UploadFile = File(...),
    user: User = Depends(require_tenant_user),
    service: VoterService = Depends(get_voter_service),
):
    content = await file.read()
    return service.import_csv(tenant_scope(user), content)


@router.get("/{voter_id}", response_model=VoterOut)
def get_voter(
    voter_id: int, user: User = Depends(require_tenant_user), service: VoterService = Depends(get_voter_service)
):
    return voter_to_out(service.get_voter(tenant_scope(user), voter_id))


@router.patch("/{voter_id}", response_model=VoterOut)
def update_voter(
    voter_id: int,
    payload: VoterUpdate,
    user: User = Depends(require_tenant_user),
    service: VoterService = Depends(get_voter_service),
):
    return voter_to_out(service.update_voter(tenant_scope(user), voter_id, payload))


@router.post("/{voter_id}/signature", response_model=VoterOut)
async def upload_voter_signature(
    voter_id: int,
    file: UploadFile = File(...),
    user: User = Depends(require_tenant_user),
    service: VoterService = Depends(get_voter_service),
):
    content = await file.read()
    return voter_to_out(
        service.set_signature(tenant_scope(user), voter_id, file.filename or "signature.png", content)
    )


@router.get("/{voter_id}/signature")
def get_voter_signature(
    voter_id: int, user: User = Depends(require_tenant_user), voters: VoterRepository = Depends(get_voter_repository)
):
    voter = voters.get(tenant_scope(user), voter_id)
    if not voter or not voter.signature_image_path:
        raise NotFoundError("Signature not found")
    storage = get_file_storage()
    path = storage.resolve(voter.signature_image_path)
    if not path.exists():
        raise NotFoundError("Signature file missing")
    return FileResponse(path)
