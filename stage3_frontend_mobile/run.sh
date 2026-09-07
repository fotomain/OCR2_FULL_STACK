#!/bin/bash
set -e

# Increase macOS file descriptor limit to avoid Metro EMFILE watcher crashes
ulimit -n 10240 2>/dev/null || true

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$DIR/.." && pwd )"

# Free port 8081 if occupied
free_port() {
    local port=$1
    local pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "🛑 Stopping existing process on port $port (PID: $pids)..."
        kill -9 $pids 2>/dev/null || true
        sleep 0.5
    fi
}
free_port 8081

# Check if Stage 1 FastAPI is running on port 8000; if not, start it
if ! curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "⚡ Stage 1 ML OCR is not running. Starting Stage 1 FastAPI on http://127.0.0.1:8000..."
    "$ROOT_DIR/run_stage1_ml_ocr" &
    STAGE1_PID=$!
    for i in {1..15}; do
        if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
            echo "✅ Stage 1 ML OCR is ONLINE (PID: $STAGE1_PID)"
            break
        fi
        sleep 1
    done
else
    echo "✅ Stage 1 ML OCR is already running on http://127.0.0.1:8000"
fi

cd "$DIR"

echo "======================================================================="
echo " 🚀 Launching Stage 3: React Native Expo Mobile App (Material Design 3)"
echo " 📍 Web Preview: http://localhost:8081"
echo " 🔗 Backend API: http://127.0.0.1:8000"
echo "======================================================================="

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing mobile npm dependencies..."
    npm install --silent || true
fi

# Launch expo web preview on port 8081
exec npx expo start --web --port 8081
