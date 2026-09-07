import os
import time
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from stage1_ml_ocr.app.core.config import settings
from stage1_ml_ocr.app.schemas.ocr import RecognitionResponse
from stage1_ml_ocr.app.services.ocr_engine import ocr_engine
from stage1_ml_ocr.app.services.extractor import extractor

router = APIRouter()

@router.post("/recognize", response_model=RecognitionResponse, summary="Recognize Document (PDF/Image)")
async def recognize_document(
    file: UploadFile = File(...),
    user_email: Optional[str] = Form(None),
    save_to_dataset: bool = Form(False)
):
    """
    Receives single PDF or Image file, runs multi-tier OCR and ML document classification,
    and returns structured JSON response.
    Optionally stores file in user dataset `./dataset_for_ml/+user_email` if requested.
    """
    start_time = time.time()
    
    # 1. Validate file extension
    ext = os.path.splitext(file.filename.lower())[1]
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {list(settings.ALLOWED_EXTENSIONS)}"
        )
        
    contents = await file.read()
    file_size = len(contents)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # 2. Extract OCR, Bounding Boxes, and Barcodes/QR Codes
    raw_text, boxes, barcodes, page_count = ocr_engine.process_file(contents, file.filename)

    # 3. Extract Entities & Compute ML Classification with Barcode Mapping
    entities = extractor.extract(raw_text, file.filename, boxes, barcodes)

    # 4. If save_to_dataset is True and user_email is provided, store in ./dataset_for_ml/+user_email
    if save_to_dataset and user_email:
        clean_email = user_email.strip().lower()
        user_folder = settings.DATASET_DIR / f"+{clean_email}"
        os.makedirs(user_folder, exist_ok=True)
        dest_path = user_folder / file.filename
        with open(dest_path, "wb") as f:
            f.write(contents)

    duration_ms = round((time.time() - start_time) * 1000.0, 2)
    now_iso = datetime.now(timezone.utc).isoformat()

    return RecognitionResponse(
        success=True,
        filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        file_size_bytes=file_size,
        user_email=user_email,
        page_count=page_count,
        raw_text=raw_text,
        entities=entities,
        bounding_boxes=boxes,
        model_version="2.1.0",
        processing_time_ms=duration_ms,
        timestamp=now_iso
    )
