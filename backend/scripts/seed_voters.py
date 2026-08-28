"""Seed a tenant with realistic fake voter records for development/testing.

Usage:
    python scripts/seed_voters.py acme-county --count 2000

Generates full name / address / DOB / DL number plus a synthetic signature
image per voter (a deterministic squiggle derived from the voter's name) so
the Unified Voter Profile and signature-comparison screens are testable
without real PII.
"""
import argparse
import hashlib
import io
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from faker import Faker
from PIL import Image, ImageDraw

from app.core.database import SessionLocal
from app.models.models import Tenant, Voter
from app.services.storage import save_file

fake = Faker()


def make_signature_png(seed_text: str) -> bytes:
    rng = random.Random(hashlib.sha256(seed_text.encode()).hexdigest())
    width, height = 320, 100
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)

    baseline = height * 0.6
    x = 20
    points = [(x, baseline)]
    while x < width - 20:
        x += rng.randint(8, 22)
        y = baseline + rng.randint(-30, 25)
        points.append((x, y))
    draw.line(points, fill=(20, 40, 120), width=3, joint="curve")

    for _ in range(rng.randint(1, 3)):
        fx = rng.randint(30, width - 30)
        fy = baseline + rng.randint(-10, 15)
        draw.line([(fx, fy - 5), (fx + rng.randint(10, 30), fy + 5)], fill=(20, 40, 120), width=2)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def make_dl_number(jurisdiction_state: str | None, rng: random.Random) -> str:
    if jurisdiction_state == "GA":
        return f"{rng.randint(100_000_000, 999_999_999)}"
    return "".join(rng.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", k=9))


def main(tenant_slug: str, count: int) -> None:
    db = SessionLocal()
    try:
        tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        if not tenant:
            print(f"No tenant found with slug '{tenant_slug}'.")
            return

        rng = random.Random(tenant.id)
        created = 0
        for i in range(count):
            full_name = fake.name()
            external_id = f"{tenant.slug[:3].upper()}-{100000 + i}"
            voter = Voter(
                tenant_id=tenant.id,
                external_voter_id=external_id,
                full_name=full_name,
                registered_address=fake.address().replace("\n", ", "),
                date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=95),
                dl_number=make_dl_number(tenant.jurisdiction_state, rng),
                veteran_id=(f"VET-{rng.randint(100000, 999999)}" if rng.random() < 0.08 else None),
                passport_id=(f"P{rng.randint(10000000, 99999999)}" if rng.random() < 0.05 else None),
            )
            db.add(voter)
            db.flush()

            signature_bytes = make_signature_png(f"{tenant.id}:{full_name}:{i}")
            voter.signature_image_path = save_file(tenant.id, "signatures", f"{voter.id}.png", signature_bytes)
            created += 1

            if created % 500 == 0:
                db.commit()
                print(f"  ...{created} voters seeded")

        db.commit()
        print(f"Seeded {created} voters for tenant '{tenant_slug}'.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("tenant_slug")
    parser.add_argument("--count", type=int, default=2000)
    args = parser.parse_args()
    main(args.tenant_slug, args.count)
