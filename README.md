# OCR2 Enterprise: Multi-Tenant Intelligent Document Recognition System

A production-grade, 3-tier document intelligence ecosystem consisting of a Python **FastAPI ML OCR backend**, a **Django executive web dashboard**, and a **React Native Expo MD3 mobile client**.

---

## 🌟 Key Architecture & Capabilities

1. **Stage 1 (`stage1_ml_ocr`)**:
   - **Input 1**: `./dataset_for_ml` base document corpus (PDFs and images).
   - **Input 2**: Multi-tenant user uploads stored dynamically into `./dataset_for_ml/+user_email`.
   - **Output**: `./output/model/` with trained TF-IDF vectorizers, scikit-learn classifiers, label encoders, and evaluation metrics.
   - **Multi-Tier OCR**: Native PDF text parsing + Tesseract raster OCR with PIL preprocessing.
   - **FastAPI Engine**: Endpoints for recognition (`/ocr/recognize`), ML training (`/model/train`), status (`/model/status`), and dataset ingestion (`/dataset/upload`).

2. **Stage 2 Web (`stage2_frontend_web`)**:
   - **Python Django 5.x** web application with corporate executive theme.
   - **Google OAuth 2.0 Login** with pre-configured Client ID & Refresh token.
   - **`StartLearnModelButton`**: Triggers ML model training across all multi-tenant datasets.
   - **`SelectDocumentButton`**: Enforces strictly single-file upload (PDF, PNG, JPG, TIFF) with drag-and-drop.
   - **Small Local CAPTCHA Component**: Dynamic math puzzle verification.
   - **`RecognizeDdocumentButton`**: Strictly locked until a file is selected and CAPTCHA is solved.
   - **Auto-Download JSON Results**: Automatically triggers browser download of the structured JSON response.

3. **Stage 3 Mobile (`stage3_frontend_mobile`)**:
   - **React Native Expo** with **Expo Router** and **React Native Paper MD3**.
   - **Redux Toolkit + Redux Saga** architecture for asynchronous side-effects.
   - **Expo SQLite** persistent database managing multi-user accounts and scan history.
   - **Camera OCR Snap**: Live camera capture automatically attached to `SelectDocumentButton`.
   - **Google Auth Session**: Google Sign-in / Sign-out / Register via Expo session.
   - **Full Functional Parity**: Same buttons, CAPTCHA challenge, and automatic JSON result saving.

4. **Architecture & Ecosystem Reports**:
   - **Interactive Gantt Report**: [`reports/OCR2_HOW_IT_WORKS_REPORT.html`](reports/OCR2_HOW_IT_WORKS_REPORT.html) with 5 embedded Mermaid Gantt diagrams detailing end-to-end pipelines, training flows, multi-tenant ingestion, and inference lifecycles.
   - **Ecosystem Map**: [`reports/ECOSYSTEM_MAP.html`](reports/ECOSYSTEM_MAP.html) providing an executive-grade system atlas and component topology.

---

## 🚀 Quick Start (Run Locally)

### 1. Launch All Services Concurrently from Mac Terminal
```bash
./run_all
# or
./start_all.sh
# or
make run_all
```

### 2. Launch Individual Services from Mac Terminal
```bash
# Run Stage 1 FastAPI ML OCR Backend (Port 8000)
./run_stage1_ml_ocr

# Run Stage 2 Django Web Frontend (Port 8080)
./run_stage2_frontend_web

# Run Stage 3 React Native Expo Mobile App (Port 8081)
./run_stage3_frontend_mobile
```
This launches:
- **Stage 1 FastAPI ML OCR**: `http://127.0.0.1:8000` (Docs: `http://127.0.0.1:8000/docs`)
- **Stage 2 Django Web Frontend**: `http://127.0.0.1:8080`
- **Stage 3 React Native Mobile App**: `http://localhost:8081`

### 3. View Interactive Architecture & Ecosystem Reports
- Open `reports/OCR2_HOW_IT_WORKS_REPORT.html` in your browser.
- Open `reports/ECOSYSTEM_MAP.html` in your browser.

---

## 🧪 Running Automated Tests

```bash
make test
```
Or individually:
```bash
# Stage 1 FastAPI Tests
PYTHONPATH=. .venv/bin/pytest stage1_ml_ocr/tests/ -v

# Stage 2 Django Tests
PYTHONPATH=stage2_frontend_web .venv/bin/python stage2_frontend_web/manage.py test ocr_web
```

## 💾 Save to GitHub (`save_to_github`)

Use the `save_to_github` command to automatically initialize Git (if needed), configure the remote origin, stage all files according to `.gitignore`, commit changes, and push to GitHub:

### Target Remote Repository:
```bash
git remote add origin https://github.com/fotomain/OCR2_FULL_STACK.git
```

### Run from Mac Terminal:
```bash
# Make sure you are in the project root:
cd /Users/mgtimber/CV26/OCR2

# Run the command:
./save_to_github
```

#### Custom Commit Message:
```bash
./save_to_github "Feat: Add light theme reports and ecosystem map"
```

#### Alternative Execution Methods:
```bash
# Using .sh extension:
./save_to_github.sh

# Using Makefile:
make save-to-github
```

### What `save_to_github` Executes Automatically:
1. Checks for Git initialization and runs `git init` if needed.
2. Ensures the primary branch is set to `main` (`git branch -M main`).
3. Connects the remote origin using `git remote add origin https://github.com/fotomain/OCR2_FULL_STACK.git` (or updates URL if origin exists).
4. Stages all codebase files respecting `.gitignore` (`git add -A`).
5. Commits any staged changes with your commit message or a timestamped default message.
6. Pushes the branch to GitHub (`git push -u origin main`).

