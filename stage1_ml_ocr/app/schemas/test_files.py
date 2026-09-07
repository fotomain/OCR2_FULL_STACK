from typing import List, Optional
from pydantic import BaseModel, Field

class TestFileInfo(BaseModel):
    filename: str
    size_bytes: int
    formatted_size: str
    extension: str
    content_type: str
    category: str
    description: str
    download_url: str
    view_url: str

class TestFilesListResponse(BaseModel):
    success: bool = True
    total_files: int
    dataset_directory: str
    files: List[TestFileInfo] = Field(default_factory=list)
