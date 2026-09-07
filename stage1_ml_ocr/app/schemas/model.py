from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class TrainingMetrics(BaseModel):
    total_samples: int
    categories_count: int
    classes: List[str]
    accuracy: float
    precision_macro: float
    recall_macro: float
    f1_macro: float
    training_duration_seconds: float
    documents_per_user: Dict[str, int] = Field(default_factory=dict)
    confusion_matrix_summary: Dict[str, Any] = Field(default_factory=dict)

class TrainResponse(BaseModel):
    success: bool
    message: str
    model_version: str
    output_directory: str
    metrics: TrainingMetrics
    trained_at: str

class ModelStatusResponse(BaseModel):
    is_trained: bool
    model_version: str
    model_path: str
    last_trained_at: Optional[str] = None
    classes: List[str] = Field(default_factory=list)
    accuracy: Optional[float] = None
    total_training_documents: int = 0
    dataset_summary: Dict[str, int] = Field(default_factory=dict)
