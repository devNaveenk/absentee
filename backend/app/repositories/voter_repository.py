import re

from sqlalchemy import or_, text
from sqlalchemy.orm import Session

from app.models.models import Voter

_FULLTEXT_UNSAFE = re.compile(r'[+\-<>()~*"@]')


class VoterRepository:
    """Voter persistence, including the type-ahead search tuned for large rolls.

    Uses indexed prefix matching (no leading wildcard) for DL number / voter
    ID, and a MySQL FULLTEXT index for name search, so lookups stay fast at
    10k-100k+ voters instead of falling back to a full table scan.
    """

    def __init__(self, db: Session):
        self.db = db

    def get(self, tenant_id: int, voter_id: int) -> Voter | None:
        return self.db.query(Voter).filter(Voter.id == voter_id, Voter.tenant_id == tenant_id).first()

    def get_by_external_id(self, tenant_id: int, external_voter_id: str) -> Voter | None:
        return (
            self.db.query(Voter)
            .filter(Voter.tenant_id == tenant_id, Voter.external_voter_id == external_voter_id)
            .first()
        )

    def list_page(self, tenant_id: int, *, offset: int, limit: int) -> list[Voter]:
        return (
            self.db.query(Voter)
            .filter(Voter.tenant_id == tenant_id)
            .order_by(Voter.full_name)
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count(self, tenant_id: int) -> int:
        return self.db.query(Voter).filter(Voter.tenant_id == tenant_id).count()

    def add(self, voter: Voter) -> Voter:
        self.db.add(voter)
        self.db.flush()
        return voter

    def commit(self) -> None:
        self.db.commit()

    def refresh(self, voter: Voter) -> None:
        self.db.refresh(voter)

    def search(self, tenant_id: int, query: str, limit: int) -> list[Voter]:
        q = query.strip()
        prefix = f"{q}%"
        filters = [Voter.dl_number.like(prefix), Voter.external_voter_id.like(prefix)]

        if len(q) >= 3:
            safe_terms = [t for t in _FULLTEXT_UNSAFE.sub(" ", q).split() if t]
            boolean_query = " ".join(f"+{term}*" for term in safe_terms) if safe_terms else None
            if boolean_query:
                filters.append(
                    text("MATCH(voters.full_name) AGAINST (:fts_query IN BOOLEAN MODE)").bindparams(
                        fts_query=boolean_query
                    )
                )
        else:
            filters.append(Voter.full_name.like(prefix))

        return (
            self.db.query(Voter)
            .filter(Voter.tenant_id == tenant_id, or_(*filters))
            .order_by(Voter.full_name)
            .limit(limit)
            .all()
        )
