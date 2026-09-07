import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from stage1_ml_ocr.app.core.config import settings
from stage1_ml_ocr.app.api.v1.api import api_router
from stage1_ml_ocr.app.services.dataset_generator import generate_initial_dataset
from stage1_ml_ocr.app.services.ml_trainer import ml_trainer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("stage1.main")

def init_app_state():
    """Initializes dataset and pre-trains model if needed."""
    logger.info("Initializing Stage 1 ML OCR Engine...")
    # 1. Generate initial datasets in ./dataset_for_ml
    generate_initial_dataset()
    # 2. Train or load active model in ./output/model
    loaded = ml_trainer.load_model_if_exists()
    if not loaded or not (settings.OUTPUT_MODEL_DIR / "model.joblib").exists():
        logger.info("No pre-existing model found. Running initial bootstrap training...")
        ml_trainer.train_model()
    logger.info("Stage 1 ML OCR Engine initialized and ready.")

# Run initialization immediately
init_app_state()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_app_state()
    yield
    # Shutdown
    logger.info("Shutting down Stage 1 ML OCR Engine.")

app = FastAPI(
    title="Stage 1: Multi-Tenant ML OCR Engine",
    description="Intelligent OCR & Machine Learning document recognition service for PDFs and Images with multi-tenant user dataset ingestion.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable CORS for Django frontend and React Native Expo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    """Liveness probe."""
    return {"status": "HEALTHY", "service": "stage1_ml_ocr", "version": settings.VERSION}

@app.get("/ready", tags=["Health"])
def readiness_check():
    """Readiness probe."""
    is_ready = (settings.OUTPUT_MODEL_DIR / "model.joblib").exists()
    return {
        "status": "READY" if is_ready else "INITIALIZING",
        "model_loaded": is_ready,
        "dataset_path": str(settings.DATASET_DIR),
        "model_output_path": str(settings.OUTPUT_MODEL_DIR)
    }

@app.get("/", tags=["Root"])
def root_info():
    return {
        "service": "Stage 1 Multi-Tenant ML OCR Engine",
        "version": settings.VERSION,
        "api_docs": "/docs",
        "endpoints": {
            "recognize_document": "/api/v1/ocr/recognize",
            "train_model": "/api/v1/model/train",
            "model_status": "/api/v1/model/status",
            "upload_dataset": "/api/v1/dataset/upload",
            "dataset_stats": "/api/v1/dataset/stats"
        }
    }
