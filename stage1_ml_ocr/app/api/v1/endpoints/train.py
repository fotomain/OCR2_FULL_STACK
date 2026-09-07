import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from stage1_ml_ocr.app.schemas.model import TrainResponse, ModelStatusResponse
from stage1_ml_ocr.app.services.ml_trainer import ml_trainer

router = APIRouter()
logger = logging.getLogger("stage1.api.train")

@router.post("/train", response_model=TrainResponse, summary="Train Document Recognition ML Model")
def train_model():
    """
    Triggers ML model training using:
    - Input1: ./dataset_for_ml (base corpus)
    - Input2: ./dataset_for_ml/+user_email (all user-uploaded document datasets)
    
    Persists trained weights, encoders, and metrics into ./output/model/
    """
    try:
        response = ml_trainer.train_model()
        return response
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=f"Model training error: {str(e)}")

@router.get("/status", response_model=ModelStatusResponse, summary="Get Model Status & Metrics")
def get_model_status():
    """Returns current active model information, accuracy, and dataset stats."""
    return ml_trainer.get_status()
