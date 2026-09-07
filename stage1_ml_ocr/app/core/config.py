import os
from pathlib import Path
from pydantic import BaseModel

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

DATASET_DIR = BASE_DIR / "dataset_for_ml"
DATASET_FOR_TESTS_DIR = BASE_DIR / "dataset_for_tests"
ROOT_DATASET_FOR_TESTS_DIR = BASE_DIR.parent / "dataset_for_tests"
OUTPUT_MODEL_DIR = BASE_DIR / "output" / "model"
REPORTS_DIR = BASE_DIR / "reports"
ROOT_REPORTS_DIR = BASE_DIR.parent / "reports"
RESULTS_DIR = BASE_DIR / "results"
ROOT_RESULTS_DIR = BASE_DIR.parent / "results"

class Settings(BaseModel):
    PROJECT_NAME: str = "Stage 1 ML OCR Engine"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "2.1.0"
    
    # Storage Paths
    BASE_DIR: Path = BASE_DIR
    DATASET_DIR: Path = DATASET_DIR
    DATASET_FOR_TESTS_DIR: Path = DATASET_FOR_TESTS_DIR
    ROOT_DATASET_FOR_TESTS_DIR: Path = ROOT_DATASET_FOR_TESTS_DIR
    OUTPUT_MODEL_DIR: Path = OUTPUT_MODEL_DIR
    REPORTS_DIR: Path = REPORTS_DIR
    ROOT_REPORTS_DIR: Path = ROOT_REPORTS_DIR
    RESULTS_DIR: Path = RESULTS_DIR
    ROOT_RESULTS_DIR: Path = ROOT_RESULTS_DIR
    
    # Google Auth Credentials (loaded from environment variables / .env)
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REFRESH_TOKEN: str = os.getenv("GOOGLE_REFRESH_TOKEN", "")
    
    # Allowed Document Extensions (All PDF and image formats)
    ALLOWED_EXTENSIONS: set = {
        ".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif",
        ".bmp", ".webp", ".gif", ".pnm", ".heic", ".svg"
    }

settings = Settings()

# Ensure directories exist
os.makedirs(settings.DATASET_DIR, exist_ok=True)
os.makedirs(settings.DATASET_FOR_TESTS_DIR, exist_ok=True)
os.makedirs(settings.ROOT_DATASET_FOR_TESTS_DIR, exist_ok=True)
os.makedirs(settings.OUTPUT_MODEL_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.ROOT_REPORTS_DIR, exist_ok=True)
os.makedirs(settings.RESULTS_DIR, exist_ok=True)
os.makedirs(settings.ROOT_RESULTS_DIR, exist_ok=True)
