import os
from datetime import datetime, timezone
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from stage1_ml_ocr.app.core.config import settings
from stage1_ml_ocr.app.schemas.dataset import DatasetUploadResponse, DatasetStatsResponse, UserDatasetInfo
from stage1_ml_ocr.app.services.ml_trainer import ml_trainer

router = APIRouter()

@router.post("/upload", response_model=DatasetUploadResponse, summary="Upload Training Data File for User")
async def upload_user_dataset_file(
    file: UploadFile = File(...),
    user_email: str = Form(...)
):
    """
    Receives an HTTP sent file + user email and stores data in user email subfolder:
    `./dataset_for_ml/+user_email` (e.g. ./dataset_for_ml/+john@example.com/invoice.pdf)
    """
    clean_email = user_email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Invalid user email address")

    ext = os.path.splitext(file.filename.lower())[1]
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {list(settings.ALLOWED_EXTENSIONS)}"
        )

    # User subfolder with + prefix as mandated in run1.docx
    folder_name = f"+{clean_email}"
    user_dir = settings.DATASET_DIR / folder_name
    os.makedirs(user_dir, exist_ok=True)

    dest_path = user_dir / file.filename
    contents = await file.read()
    file_size = len(contents)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    with open(dest_path, "wb") as f:
        f.write(contents)

    # Infer type
    doc_type = ml_trainer.infer_ground_truth_label(file.filename, folder_name, "")
    now_iso = datetime.now(timezone.utc).isoformat()

    return DatasetUploadResponse(
        success=True,
        message=f"File successfully ingested into multi-tenant user storage {folder_name}",
        filename=file.filename,
        user_email=clean_email,
        saved_path=str(dest_path.relative_to(settings.BASE_DIR)),
        file_size_bytes=file_size,
        detected_type=doc_type,
        timestamp=now_iso
    )

@router.get("/stats", response_model=DatasetStatsResponse, summary="Get Dataset Statistics & Multi-Tenant Inventory")
def get_dataset_stats():
    """Returns overview of all datasets in ./dataset_for_ml and all user subfolders."""
    total_docs = 0
    base_docs = 0
    user_datasets: list[UserDatasetInfo] = []

    if settings.DATASET_DIR.exists():
        for item in os.listdir(settings.DATASET_DIR):
            item_path = settings.DATASET_DIR / item
            if item.startswith("."):
                continue
            if item_path.is_file():
                ext = os.path.splitext(item.lower())[1]
                if ext in settings.ALLOWED_EXTENSIONS:
                    base_docs += 1
                    total_docs += 1
            elif item_path.is_dir():
                user_email = item[1:] if item.startswith("+") else item
                u_files = []
                u_size = 0
                for f in os.listdir(item_path):
                    if not f.startswith(".") and os.path.splitext(f.lower())[1] in settings.ALLOWED_EXTENSIONS:
                        f_path = item_path / f
                        u_files.append(f)
                        u_size += f_path.stat().st_size
                if u_files:
                    total_docs += len(u_files)
                    user_datasets.append(UserDatasetInfo(
                        user_email=user_email,
                        folder_name=item,
                        document_count=len(u_files),
                        file_names=u_files,
                        total_size_bytes=u_size
                    ))

    return DatasetStatsResponse(
        total_documents=total_docs,
        total_users=len(user_datasets),
        base_documents_count=base_docs,
        user_datasets=user_datasets
    )
