"""OCR extraction for scanned absentee applications and envelope flaps.

Real implementation target: GCP Document AI, free-form text-extraction
processor (~$1.50 / 1,000 pages) -- NOT the Form Parser. Document AI must
only be called for tenants in Scan Mode; Manual Mode tenants never trigger
this module (enforced by callers checking `tenant.processing_mode`).

This stub lets the application-processing workflow, storage, and audit
trail be built and tested end-to-end before GCP credentials are wired in.
Swap `StubOCRProvider` for a `DocumentAIOCRProvider` implementing the same
interface once a project/processor is available.
"""

from abc import ABC, abstractmethod
from typing import TypedDict


class ExtractedFields(TypedDict):
    full_name: str
    address: str
    dl_number: str
    confidence: float
    raw: dict


class OCRProvider(ABC):
    @abstractmethod
    def extract_application_fields(self, image_path: str) -> ExtractedFields: ...


class StubOCRProvider(OCRProvider):
    def extract_application_fields(self, image_path: str) -> ExtractedFields:
        return {
            "full_name": "",
            "address": "",
            "dl_number": "",
            "confidence": 0.0,
            "raw": {
                "provider": "stub",
                "note": "Document AI is not yet configured. Fields must be entered/verified manually.",
                "image_path": image_path,
            },
        }


def get_ocr_provider() -> OCRProvider:
    return StubOCRProvider()
