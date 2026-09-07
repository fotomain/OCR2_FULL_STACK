from fastapi import APIRouter
from stage1_ml_ocr.app.api.v1.endpoints import train, recognize, dataset, test_files

api_router = APIRouter()

api_router.include_router(recognize.router, prefix="/ocr", tags=["Document Recognition"])
api_router.include_router(train.router, prefix="/model", tags=["ML Model Training"])
api_router.include_router(dataset.router, prefix="/dataset", tags=["Multi-Tenant Dataset Management"])
api_router.include_router(test_files.router, prefix="/tests", tags=["Test Dataset Documents"])
