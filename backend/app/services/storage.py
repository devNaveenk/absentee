"""File storage for scanned documents and signature images.

An abstract `FileStorage` interface with a local-disk implementation,
mirroring the OCRProvider pattern (app/services/ocr.py) so both "external
system" integrations in this codebase follow the same shape: swap the
factory's return value for a GCS/S3-backed implementation later without
touching any caller.
"""

import uuid
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.exceptions import ValidationError

UPLOAD_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads"


class FileStorage(ABC):
    @abstractmethod
    def save(self, tenant_id: int, category: str, filename: str, content: bytes) -> str:
        """Persist `content` and return a relative path usable with `resolve`."""

    @abstractmethod
    def resolve(self, relative_path: str) -> Path:
        """Return an absolute, validated filesystem path for a stored file."""


class LocalFileStorage(FileStorage):
    def __init__(self, root: Path = UPLOAD_ROOT):
        self.root = root

    def save(self, tenant_id: int, category: str, filename: str, content: bytes) -> str:
        ext = Path(filename).suffix or ".bin"
        stored_name = f"{uuid.uuid4().hex}{ext}"
        directory = self.root / str(tenant_id) / category
        directory.mkdir(parents=True, exist_ok=True)
        path = directory / stored_name
        path.write_bytes(content)
        return str(path.relative_to(self.root))

    def resolve(self, relative_path: str) -> Path:
        resolved = (self.root / relative_path).resolve()
        root_resolved = self.root.resolve()
        if root_resolved not in resolved.parents and resolved != root_resolved:
            raise ValidationError("Invalid file path")
        return resolved


def get_file_storage() -> FileStorage:
    return LocalFileStorage()
