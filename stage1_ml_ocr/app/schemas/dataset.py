from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class DatasetUploadResponse(BaseModel):
    success: bool
    message: str
    filename: str
    user_email: str
    saved_path: str
    file_size_bytes: int
    detected_type: Optional[str] = None
    timestamp: str

class UserDatasetInfo(BaseModel):
    user_email: str
    folder_name: str
    document_count: int
    file_names: List[str] = Field(default_factory=list)
    total_size_bytes: int

class DatasetStatsResponse(BaseModel):
    total_documents: int
    total_users: int
    base_documents_count: int
    user_datasets: List[UserDatasetInfo] = Field(default_factory=list)
