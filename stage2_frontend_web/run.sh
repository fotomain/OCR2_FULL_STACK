#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$DIR/.." && pwd )"

# Free port 8080 if occupied
free_port() {
    local port=$1
    local pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "🛑 Stopping existing process on port $port (PID: $pids)..."
        kill -9 $pids 2>/dev/null || true
        sleep 0.5
    fi
}
free_port 8080

if [ -f "$ROOT_DIR/.venv/bin/python" ]; then
    PYTHON_EXEC="$ROOT_DIR/.venv/bin/python"
else
    PYTHON_EXEC="python3"
fi

export PYTHONPATH="$ROOT_DIR:$DIR:$PYTHONPATH"

echo "=================================================="
echo " Starting Stage 2: Django Web Frontend"
echo " Host: http://127.0.0.1:8080"
echo "=================================================="

# Run migrations
"$PYTHON_EXEC" "$DIR/manage.py" migrate --noinput

exec "$PYTHON_EXEC" "$DIR/manage.py" runserver 0.0.0.0:8080
