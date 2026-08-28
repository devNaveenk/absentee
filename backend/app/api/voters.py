from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_tenant_user, tenant_scope
from app.core.exceptions import NotFoundError
from app.models.models import User
from app.repositories.voter_repository import VoterRepository
from app.schemas.mappers import voter_to_out
from app.schemas.schemas import VoterOut, VoterSearchResult
from app.services.storage import get_file_storage

router = APIRouter(prefix="/api/voters", tags=["voters"], dependencies=[Depends(require_tenant_user)])


def get_voter_repository(db: Session = Depends(get_db)) -> VoterRepository:
    return VoterRepository(db)


@router.get("/search", response_model=list[VoterSearchResult])
def search_voters(
    q: str = Query(..., min_length=2),
    limit: int = Query(20, le=50),
    user: User = Depends(require_tenant_user),
    voters: VoterRepository = Depends(get_voter_repository),
):
    return voters.search(tenant_scope(user), q, limit)


@router.get("/{voter_id}", response_model=VoterOut)
def get_voter(
    voter_id: int, user: User = Depends(require_tenant_user), voters: VoterRepository = Depends(get_voter_repository)
):
    voter = voters.get(tenant_scope(user), voter_id)
    if not voter:
        raise NotFoundError("Voter not found")
    return voter_to_out(voter)


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
