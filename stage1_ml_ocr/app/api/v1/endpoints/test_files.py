import os
import mimetypes
from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse

from stage1_ml_ocr.app.core.config import settings
from stage1_ml_ocr.app.schemas.test_files import TestFileInfo, TestFilesListResponse

router = APIRouter()

DOC_METADATA_MAP: Dict[str, Dict[str, str]] = {
    "sample_vita_genomics.pdf": {
        "category": "GENE_CELLULAR_THERAPEUTICS",
        "description": "5-line Gene Therapy invoice (Onasemnogene, Voretigene, EtranaDez) with cryogenic vapor tracking and GS1/HIBC/EAN/CODE39/ITF barcodes."
    },
    "sample_baltic_eye_ophthalmic.pdf": {
        "category": "OPHTHALMIC_SURGERY",
        "description": "5-line Ophthalmic micro-surgery invoice (Aflibercept, Sodium Hyaluronate, Moxifloxacin) with wrapped unit columns and full regulatory requisites."
    },
    "sample_nexus_biopharma.pdf": {
        "category": "MEDICAL_PHARMA_INVOICE",
        "description": "5-line Clinical Grade Oncology invoice (Remdesivir, Keytruda, Enoxaparin) with multi-standard barcode payloads."
    },
    "sample_medical_invoice.pdf": {
        "category": "MEDICAL_PHARMA_INVOICE",
        "description": "Standard pharmaceutical tax invoice with active cold-chain RFID monitoring and Latvian ZVA registry compliance."
    },
    "sample_baltic_neuroscience.pdf": {
        "category": "NEUROSCIENCE_BIOLOGICS",
        "description": "Neuroscience biologics invoice with specialized delivery terms and multi-currency FOREX conversion benchmark."
    },
    "sample_isotope_biopharma_rad.pdf": {
        "category": "RADIOPHARMACEUTICALS",
        "description": "Radio-pharmaceuticals invoice with specific half-life tracking attributes and cryptographic audit token."
    },
    "sample_nordic_cardiovascular.pdf": {
        "category": "CARDIOVASCULAR_DEVICES",
        "description": "Interventional cardiology and stent devices delivery note and invoice."
    },
    "sample_nordic_radiopharma.pdf": {
        "category": "NUCLEAR_MEDICINE",
        "description": "Nuclear medicine diagnostics invoice with hot-cell packaging and regulatory ZVA badges."
    },
    "base_invoice_01.pdf": {
        "category": "COMMERCIAL_INVOICE",
        "description": "Commercial enterprise tax invoice with line items, VAT breakdown, and QR code verification."
    },
    "base_receipt_01.png": {
        "category": "PURCHASE_RECEIPT",
        "description": "High-contrast retail purchase receipt with itemized lines, total sum, and merchant metadata."
    }
}

def get_test_directories() -> List[Path]:
    dirs = []
    if settings.DATASET_FOR_TESTS_DIR.exists():
        dirs.append(settings.DATASET_FOR_TESTS_DIR)
    if settings.ROOT_DATASET_FOR_TESTS_DIR.exists() and settings.ROOT_DATASET_FOR_TESTS_DIR != settings.DATASET_FOR_TESTS_DIR:
        dirs.append(settings.ROOT_DATASET_FOR_TESTS_DIR)
    return dirs

def format_bytes(size: int) -> str:
    if size < 1024:
        return f"{size} B"
    elif size < 1024 * 1024:
        return f"{round(size / 1024.0, 1)} KB"
    else:
        return f"{round(size / (1024.0 * 1024.0), 2)} MB"

@router.get("/files", response_model=TestFilesListResponse, summary="List available test dataset documents")
@router.get("/list", response_model=TestFilesListResponse, include_in_schema=False)
def list_test_files(request: Request) -> TestFilesListResponse:
    """
    Returns a comprehensive list of all sample documents in ./dataset_for_tests
    including metadata, categories, file sizes, and direct download links for testing.
    """
    test_dirs = get_test_directories()
    seen_files = set()
    file_list: List[TestFileInfo] = []

    for d in test_dirs:
        for entry in sorted(os.listdir(d)):
            file_path = d / entry
            if not file_path.is_file() or entry.startswith("."):
                continue
            if entry in seen_files:
                continue

            seen_files.add(entry)
            size = file_path.stat().st_size
            ext = file_path.suffix.lower()
            mime_type, _ = mimetypes.guess_type(str(file_path))
            mime_type = mime_type or "application/octet-stream"

            meta = DOC_METADATA_MAP.get(entry, {
                "category": "SAMPLE_DOCUMENT",
                "description": f"Sample document file ({ext.upper()}) for document recognition and OCR testing."
            })

            # Build relative/absolute URLs
            base_url = str(request.base_url).rstrip("/")
            download_url = f"{base_url}/api/v1/tests/download/{entry}"
            view_url = f"{base_url}/api/v1/tests/view/{entry}"

            file_list.append(TestFileInfo(
                filename=entry,
                size_bytes=size,
                formatted_size=format_bytes(size),
                extension=ext,
                content_type=mime_type,
                category=meta["category"],
                description=meta["description"],
                download_url=download_url,
                view_url=view_url
            ))

    return TestFilesListResponse(
        success=True,
        total_files=len(file_list),
        dataset_directory="./dataset_for_tests",
        files=file_list
    )

@router.get("/download/{filename}", summary="Download a specific test file from dataset_for_tests")
def download_test_file(filename: str):
    """Download a file as an attachment from ./dataset_for_tests."""
    test_dirs = get_test_directories()
    target_path = None
    for d in test_dirs:
        candidate = d / filename
        if candidate.is_file():
            target_path = candidate
            break

    if not target_path or not target_path.exists():
        raise HTTPException(status_code=404, detail=f"Test file '{filename}' not found in ./dataset_for_tests")

    mime_type, _ = mimetypes.guess_type(str(target_path))
    mime_type = mime_type or "application/octet-stream"

    return FileResponse(
        path=target_path,
        filename=filename,
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/view/{filename}", summary="View a specific test file inline")
def view_test_file(filename: str):
    """View a file inline from ./dataset_for_tests."""
    test_dirs = get_test_directories()
    target_path = None
    for d in test_dirs:
        candidate = d / filename
        if candidate.is_file():
            target_path = candidate
            break

    if not target_path or not target_path.exists():
        raise HTTPException(status_code=404, detail=f"Test file '{filename}' not found in ./dataset_for_tests")

    mime_type, _ = mimetypes.guess_type(str(target_path))
    mime_type = mime_type or "application/octet-stream"

    return FileResponse(
        path=target_path,
        media_type=mime_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )
