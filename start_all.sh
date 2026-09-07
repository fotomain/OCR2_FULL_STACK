#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Free ports 8000, 8080, 8081 if occupied
free_port() {
    local port=$1
    local pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "🛑 Stopping existing process on port $port (PID: $pids)..."
        kill -9 $pids 2>/dev/null || true
        sleep 0.5
    fi
}

echo "🧹 Freeing ports 8000, 8080, and 8081 before startup..."
free_port 8000
free_port 8080
free_port 8081

echo "======================================================================="
echo " 🚀 LAUNCHING OCR2 ENTERPRISE 3-TIER ECOSYSTEM"
echo " 1. Stage 1 ML OCR Backend:       http://127.0.0.1:8000 (Docs: /docs)"
echo " 2. Stage 2 Django Web Frontend:  http://127.0.0.1:8080"
echo " 3. Stage 3 Mobile Expo App (MD3): http://127.0.0.1:8081"
echo " 4. Interactive Gantt Report:     file://$DIR/reports/OCR2_HOW_IT_WORKS_REPORT.html"
echo " 5. Interactive Ecosystem Map:    file://$DIR/reports/ECOSYSTEM_MAP.html"
echo "======================================================================="

# Trap to kill all background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all OCR2 services..."
    kill $(jobs -p) 2>/dev/null || true
    free_port 8000
    free_port 8080
    free_port 8081
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start Stage 1 FastAPI
echo "▶ Starting Stage 1 ML OCR Backend..."
./stage1_ml_ocr/run.sh &
PID_STAGE1=$!

# Wait for Stage 1 to become ready
echo "⏳ Waiting for Stage 1 ML OCR to initialize..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/health > /dev/null; then
        echo "✓ Stage 1 ML OCR is ONLINE!"
        break
    fi
    sleep 1
done

# 2. Start Stage 2 Django Web Frontend
echo "▶ Starting Stage 2 Django Web Frontend..."
./stage2_frontend_web/run.sh &
PID_STAGE2_WEB=$!

# 3. Start Stage 3 React Native Expo Mobile App (MD3)
echo "▶ Starting Stage 3 React Native Expo Mobile App (Material Design 3)..."
./stage3_frontend_mobile/run.sh &
PID_STAGE3_MOBILE=$!

echo ""
echo "======================================================================="
echo " ✅ ALL SERVICES RUNNING!"
echo " • Web Dashboard:  http://127.0.0.1:8080"
echo " • FastAPI Docs:   http://127.0.0.1:8000/docs"
echo " • Mobile Preview: http://127.0.0.1:8081"
echo " Press Ctrl+C to stop all services."
echo "======================================================================="

# Keep script running
wait
