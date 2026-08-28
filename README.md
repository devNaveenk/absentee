# BallotDA

Multi-tenant absentee ballot automation platform. React (Vite) frontend, FastAPI backend, MySQL database.

## What's built (Phase 1 + Phase 2)

Per the BallotDA PRD:

**Phase 1 — application receipt through ABS Sent:**
- **Multi-tenant architecture**: shared MySQL database, every tenant-scoped table carries `tenant_id`. Each tenant is configured with a **Processing Mode** (Scan or Manual), an optional **jurisdiction state** (e.g. `GA`), a **cure notification method**, and a **configurable verification checklist**.
- **Jurisdiction-specific verification (PRD §2)**: GA tenants default to Full Name + Registered Address + GA DL Number; other jurisdictions default to Full Name + Address + visual signature comparison, and can also enable Veteran ID / Passport ID. This isn't just metadata — the review screens render the tenant's checklist and the backend **rejects Approve/Final-Approval requests** until every configured item is confirmed, with the confirmation recorded in the audit trail.
- **Voter search & Unified Voter Profile**: type-ahead search (`GET /api/voters/search`) across name / DL number / external voter ID, and a consolidated profile (name, address, DL number, signature image) used throughout verification. Tuned for the PRD's 10k–100k+ voter scale: a MySQL FULLTEXT index on name (real word search, not a linear scan) and indexed prefix matching on DL number / voter ID, instead of a leading-wildcard `LIKE` that can't use an index.
- **Absentee application workflow**: Unprocessed Incoming queue → clerk review (split-screen: submitted data vs. matched voter) → **Approve** (→ ABS Sent), **Reject** (with reason), or **Cure** (with reason + notification method). Corrected resubmissions create a linked child application (Parent-Child via `parent_application_id`) that appears in the Reapproval Queue.

**Phase 2 — returned ballot verification & security:**
- **Returned ballots**: outer-envelope intake (manual or scan+OCR, gated by the same Processing Mode), auto-linked to the voter's original ABS-sent application when a match is found.
- **Split-screen verification**: envelope scan/OCR data + original absentee application on one side, Unified Voter Profile + signature on the other — matching the dual-envelope model in the PRD.
- **Final Approval → Final Bin**, or **Admin Rejection** with one of the five PRD-defined reasons (already voted in person, moved outside jurisdiction, deceased, credential mismatch, signature mismatch). OCR never makes the eligibility determination — only a manual action does.

**Shared infrastructure:**
- **Full audit trail** on both applications and returned ballots (`application_events` / `returned_ballot_events`) — actor, reason, timestamp on every transition.
- **OCR (Scan Mode only)**: Document AI calls are stubbed behind an `OCRProvider` interface (`app/services/ocr.py`) and are only invoked when a tenant's `processing_mode` is `scan` — Manual Mode tenants never trigger it, matching the PRD's cost-control requirement. Swap in a `DocumentAIOCRProvider` when GCP credentials are available; no business logic needs to change.
- **Operational dashboard**: 4 text/numeric metric cards only (Daily Incoming Requests, Completed Ballots Received — now real, Current Queued Items, Items in Cure Process) — intentionally no charts, per the PRD's UI constraint.
- **Superadmin**: tenant provisioning (incl. processing mode / jurisdiction / cure method), per-tenant rate limiting, usage logs.

**Still stubbed (by design, per project decision)**: real GCP Document AI wiring, and real email/physical-mail sending for Cure and voter notifications — both are logged as audit events only, behind interfaces that don't require touching business logic when wired up for real.

## Project layout

```
backend/     FastAPI app, SQLAlchemy models, Alembic migrations, uploads/ (local file storage)
frontend/    React + Vite + Tailwind (v4) app
docker-compose.yml   optional local MySQL for development
```

## Backend architecture

The backend is layered so each piece has one reason to change:

```
app/api/            Thin HTTP controllers: parse the request, call a service, map the result to a
                     response schema. No SQLAlchemy queries and no business rules live here.
app/services/        Business logic — status transitions, the verification-checklist gate, OCR/
                     storage/notification orchestration. Raises framework-free errors
                     (app/core/exceptions.py), not HTTPException.
app/repositories/     All SQLAlchemy queries for one aggregate (Tenant, Voter, AbsenteeApplication,
                     ReturnedBallot, User, UsageLog). Services depend on these, never on raw
                     `db.query(...)` calls.
app/domain/          Pure, framework-free business rules shared across services (e.g. the
                     verification-checklist gate, record-number generation) — easy to unit test
                     in isolation.
app/schemas/         Pydantic request/response DTOs, plus mappers.py (ORM -> DTO conversion) so
                     that mapping logic has one home instead of being copy-pasted per router.
app/models/          SQLAlchemy ORM models. mixins.py holds the shared audit-event column set used
                     by both ApplicationEvent and ReturnedBallotEvent.
```

Three integrations follow the same swappable-provider shape (an abstract interface + a stub
implementation + a `get_x()` factory), so replacing a stub with a real integration never touches
a service or router:

- `app/services/ocr.py` — `OCRProvider` (stub today; swap in `DocumentAIOCRProvider` later)
- `app/services/storage.py` — `FileStorage` (local disk today; swap in GCS/S3 later)
- `app/services/notifications.py` — `NotificationProvider` (stub today; swap in a real email/mail sender later)

This refactor changed no API contract, no database schema, and no request/response shape — it's
a pure internal reorganization, verified end-to-end against the existing data after the change.

## Backend setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt        # add -r requirements-dev.txt too if you want the seed script (Faker + Pillow)
cp .env.example .env                   # edit JWT_SECRET / DATABASE_URL as needed
```

Point `DATABASE_URL` in `.env` at a MySQL instance (Docker via `docker compose up -d`, or a native/local install). Then:

```bash
alembic upgrade head
python scripts/seed_superadmin.py admin@ballotda.com "a-strong-password"
```

Create a tenant (via the superadmin UI or API) with `processing_mode` set to `manual` or `scan`, then seed it with fake voters for local testing:

```bash
python scripts/seed_voters.py <tenant-slug> --count 2000
```

Run the API:

```bash
uvicorn app.main:app --reload --port 8010
```

API docs at http://localhost:8010/docs. (Port 8010 by default — adjust and update `frontend/vite.config.js`'s proxy target if 8000 is free on your machine.)

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Login flows

- **Superadmin**: `/login` → "Superadmin" tab → email + password (no org slug). Provisions tenants and their processing mode.
- **Tenant users**: `/login` → "Tenant Login" tab → org slug + email + password. Land on the Operational Dashboard, with nav to Applications and Returned Ballots (each has its own "+ New" action).

## Notes for production

- Move the rate limiter to Redis if you run more than one backend process.
- Move file storage (`app/services/storage.py`) to GCS/S3 — it's behind an interface so callers don't change.
- Wire a real `DocumentAIOCRProvider` (GCP Document AI, free-form text extraction — not Form Parser) into `app/services/ocr.py::get_ocr_provider`.
- Wire real email/mail sending for the Cure notification workflow (currently logged as an audit event only).
- Set a strong, random `JWT_SECRET` and restrict `CORS_ORIGINS`.
- Usage logs and application events grow unbounded; add retention/partitioning once volume grows.
