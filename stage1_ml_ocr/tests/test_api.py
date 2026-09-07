import os
import pytest
from fastapi.testclient import TestClient
from stage1_ml_ocr.app.main import app
from stage1_ml_ocr.app.core.config import settings

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "HEALTHY"

def test_readiness():
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["model_loaded"] is True

def test_dataset_stats():
    response = client.get("/api/v1/dataset/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_documents"] >= 3
    assert data["total_users"] >= 1

def test_upload_user_dataset():
    dummy_pdf = b"%PDF-1.4 dummy pdf content for invoice testing"
    files = {"file": ("test_invoice.pdf", dummy_pdf, "application/pdf")}
    data = {"user_email": "testuser@company.com"}
    response = client.post("/api/v1/dataset/upload", files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["user_email"] == "testuser@company.com"
    
    # Check physical folder creation: ./dataset_for_ml/+user_email
    target_folder = settings.DATASET_DIR / "+testuser@company.com"
    assert target_folder.exists()
    assert (target_folder / "test_invoice.pdf").exists()

def test_train_model_and_ml_report():
    response = client.post("/api/v1/model/train")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["metrics"]["accuracy"] > 0.5
    assert len(data["metrics"]["classes"]) > 0
    assert (settings.OUTPUT_MODEL_DIR / "model.joblib").exists()
    assert (settings.OUTPUT_MODEL_DIR / "metadata.json").exists()
    
    # Verify ML_REPORT.html generation in ./results
    assert (settings.RESULTS_DIR / "ML_REPORT.html").exists()
    assert (settings.ROOT_RESULTS_DIR / "ML_REPORT.html").exists()

def test_recognize_document_with_barcodes_and_qrs():
    sample_pdf_path = settings.DATASET_DIR / "base_medical_invoice_01.pdf"
    assert sample_pdf_path.exists()
    with open(sample_pdf_path, "rb") as f:
        pdf_bytes = f.read()
    
    files = {"file": ("base_medical_invoice_01.pdf", pdf_bytes, "application/pdf")}
    data = {"user_email": "testuser@company.com", "save_to_dataset": "false"}
    response = client.post("/api/v1/ocr/recognize", files=files, data=data)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "entities" in json_data
    ent = json_data["entities"]
    
    # Verify Header/Footer barcodes
    assert len(ent["all_barcodes"]) > 0
    header_codes = ent["header_barcodes"] + ent["header_qr_codes"]
    footer_codes = ent["footer_barcodes"] + ent["footer_qr_codes"]
    assert len(header_codes) > 0, "Header barcodes/QRs should be detected"
    assert len(footer_codes) > 0, "Footer barcodes/QRs should be detected"
    
    # Verify item lines barcodes
    assert len(ent["items"]) > 0
    items_with_barcodes = [it for it in ent["items"] if it.get("barcode") or it.get("qr_code")]
    assert len(items_with_barcodes) > 0, "Items should have barcode/QR associations"

def test_list_and_download_test_files():
    # 1. Test listing files from ./dataset_for_tests
    r_list = client.get("/api/v1/tests/files")
    assert r_list.status_code == 200
    data = r_list.json()
    assert data["success"] is True
    assert data["total_files"] >= 8
    assert len(data["files"]) >= 8

    # Find sample_vita_genomics.pdf
    vita_file = next((f for f in data["files"] if f["filename"] == "sample_vita_genomics.pdf"), None)
    assert vita_file is not None
    assert vita_file["category"] == "GENE_CELLULAR_THERAPEUTICS"
    assert "/api/v1/tests/download/sample_vita_genomics.pdf" in vita_file["download_url"]

    # 2. Test downloading file
    r_dl = client.get("/api/v1/tests/download/sample_vita_genomics.pdf")
    assert r_dl.status_code == 200
    assert len(r_dl.content) > 1000
    assert "attachment" in r_dl.headers.get("content-disposition", "")

