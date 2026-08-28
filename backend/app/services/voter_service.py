import csv
import io
from datetime import date, datetime

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.models.models import Voter
from app.repositories.voter_repository import VoterRepository
from app.schemas.schemas import VoterImportRowError, VoterImportSummary
from app.services.storage import FileStorage, get_file_storage

REQUIRED_CSV_COLUMNS = {"full_name", "registered_address"}
KNOWN_CSV_COLUMNS = REQUIRED_CSV_COLUMNS | {
    "external_voter_id",
    "date_of_birth",
    "dl_number",
    "veteran_id",
    "passport_id",
}


def _parse_date(value: str) -> date | None:
    value = (value or "").strip()
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


class VoterService:
    """Voter roll management: manual entry, edits, and bulk CSV import."""

    def __init__(self, db: Session, voters: VoterRepository | None = None, storage: FileStorage | None = None):
        self.db = db
        self.voters = voters or VoterRepository(db)
        self.storage = storage or get_file_storage()

    def list_voters(self, tenant_id: int, *, offset: int, limit: int) -> tuple[list[Voter], int]:
        return self.voters.list_page(tenant_id, offset=offset, limit=limit), self.voters.count(tenant_id)

    def get_voter(self, tenant_id: int, voter_id: int) -> Voter:
        voter = self.voters.get(tenant_id, voter_id)
        if not voter:
            raise NotFoundError("Voter not found")
        return voter

    def create_voter(self, tenant_id: int, payload) -> Voter:
        if payload.external_voter_id and self.voters.get_by_external_id(tenant_id, payload.external_voter_id):
            raise ValidationError(f"A voter with external ID '{payload.external_voter_id}' already exists")

        voter = self.voters.add(
            Voter(
                tenant_id=tenant_id,
                full_name=payload.full_name,
                registered_address=payload.registered_address,
                external_voter_id=payload.external_voter_id,
                date_of_birth=payload.date_of_birth,
                dl_number=payload.dl_number,
                veteran_id=payload.veteran_id,
                passport_id=payload.passport_id,
            )
        )
        self.voters.commit()
        self.voters.refresh(voter)
        return voter

    def update_voter(self, tenant_id: int, voter_id: int, payload) -> Voter:
        voter = self.get_voter(tenant_id, voter_id)
        for field in (
            "full_name",
            "registered_address",
            "external_voter_id",
            "date_of_birth",
            "dl_number",
            "veteran_id",
            "passport_id",
        ):
            value = getattr(payload, field)
            if value is not None:
                setattr(voter, field, value)
        self.voters.commit()
        self.voters.refresh(voter)
        return voter

    def set_signature(self, tenant_id: int, voter_id: int, filename: str, content: bytes) -> Voter:
        voter = self.get_voter(tenant_id, voter_id)
        voter.signature_image_path = self.storage.save(tenant_id, "signatures", filename, content)
        self.voters.commit()
        self.voters.refresh(voter)
        return voter

    def import_csv(self, tenant_id: int, content: bytes) -> VoterImportSummary:
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise ValidationError("CSV file must be UTF-8 encoded")

        reader = csv.DictReader(io.StringIO(text))
        if reader.fieldnames is None:
            raise ValidationError("CSV file has no header row")

        headers = {h.strip().lower() for h in reader.fieldnames}
        missing = REQUIRED_CSV_COLUMNS - headers
        if missing:
            raise ValidationError(f"CSV is missing required column(s): {', '.join(sorted(missing))}")

        created = updated = skipped = 0
        errors: list[VoterImportRowError] = []

        for row_num, raw_row in enumerate(reader, start=2):
            row = {(k or "").strip().lower(): (v or "").strip() for k, v in raw_row.items() if k}
            full_name = row.get("full_name", "")
            registered_address = row.get("registered_address", "")
            if not full_name or not registered_address:
                skipped += 1
                errors.append(VoterImportRowError(row=row_num, error="full_name and registered_address are required"))
                continue

            external_voter_id = row.get("external_voter_id") or None
            fields = {
                "full_name": full_name,
                "registered_address": registered_address,
                "date_of_birth": _parse_date(row.get("date_of_birth", "")),
                "dl_number": row.get("dl_number") or None,
                "veteran_id": row.get("veteran_id") or None,
                "passport_id": row.get("passport_id") or None,
            }

            try:
                existing = (
                    self.voters.get_by_external_id(tenant_id, external_voter_id) if external_voter_id else None
                )
                if existing:
                    for key, value in fields.items():
                        setattr(existing, key, value)
                    updated += 1
                else:
                    self.voters.add(Voter(tenant_id=tenant_id, external_voter_id=external_voter_id, **fields))
                    created += 1
            except Exception as exc:  # noqa: BLE001 - surface any row-level failure without aborting the batch
                skipped += 1
                errors.append(VoterImportRowError(row=row_num, error=str(exc)))

        self.voters.commit()
        return VoterImportSummary(created=created, updated=updated, skipped=skipped, errors=errors[:50])
