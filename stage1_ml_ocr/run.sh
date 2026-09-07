#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$DIR/.." && pwd )"

# Free port 8000 if occupied
free_port() {
    local port=$1
    local pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "🛑 Stopping existing process on port $port (PID: $pids)..."
        kill -9 $pids 2>/dev/null || true
        sleep 0.5
    fi
}
free_port 8000

if [ -f "$ROOT_DIR/.venv/bin/uvicorn" ]; then
    PYTHON_EXEC="$ROOT_DIR/.venv/bin/python"
    UVICORN_EXEC="$ROOT_DIR/.venv/bin/uvicorn"
elif [ -f "$DIR/.venv/bin/uvicorn" ]; then
    PYTHON_EXEC="$DIR/.venv/bin/python"
    UVICORN_EXEC="$DIR/.venv/bin/uvicorn"
else
    PYTHON_EXEC="python3"
    UVICORN_EXEC="uvicorn"
fi

export PYTHONPATH="$ROOT_DIR:$DIR:$PYTHONPATH"

echo "=================================================="
echo " Starting Stage 1: ML OCR FastAPI Backend Server"
echo " Host: http://127.0.0.1:8000"
echo " Docs: http://127.0.0.1:8000/docs"
echo "=================================================="

exec "$UVICORN_EXEC" stage1_ml_ocr.app.main:app --host 0.0.0.0 --port 8000 --reload
