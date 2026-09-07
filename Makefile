.PHONY: all run test clean install stop

all: test

stop:
	@echo "🛑 Stopping all processes on ports 8000, 8080, 8081..."
	@kill -9 $$(lsof -ti:8000) 2>/dev/null || true
	@kill -9 $$(lsof -ti:8080) 2>/dev/null || true
	@kill -9 $$(lsof -ti:8081) 2>/dev/null || true
	@echo "✓ All ports cleared."

install:
	python3 -m venv .venv
	.venv/bin/pip install --upgrade pip
	.venv/bin/pip install -r stage1_ml_ocr/requirements.txt
	.venv/bin/pip install -r stage2_frontend_web/requirements.txt
	cd stage3_frontend_mobile && npm install

run:
	./run_all

run_all:
	./run_all

run-all:
	./run_all

run-stage1:
	./run_stage1_ml_ocr

run-stage2-web:
	./run_stage2_frontend_web

run-stage3-mobile:
	./run_stage3_frontend_mobile

run-stage2-mobile:
	./run_stage3_frontend_mobile

test:
	@echo "Running Stage 1 FastAPI Tests..."
	PYTHONPATH=. .venv/bin/pytest stage1_ml_ocr/tests/ -v
	@echo "Running Stage 2 Django Tests..."
	PYTHONPATH=stage2_frontend_web .venv/bin/python stage2_frontend_web/manage.py test ocr_web

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

save-to-github:
	./save_to_github

save_to_github:
	./save_to_github
