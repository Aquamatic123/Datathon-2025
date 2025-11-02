#!/bin/bash
# Master start script - starts both backend and frontend

echo "================================================"
echo "🚀 Starting Full Stack Application"
echo "================================================"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "================================================"
    echo "🛑 Shutting down servers..."
    echo "================================================"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend in background
echo "1️⃣  Starting Backend..."
cd "$SCRIPT_DIR/backend"
bash start_backend.sh > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "   Waiting for backend to start..."
sleep 3

# Start frontend in background
echo ""
echo "2️⃣  Starting Frontend..."
cd "$SCRIPT_DIR"
bash start_frontend.sh > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "================================================"
echo "✅ Both servers are starting up!"
echo "================================================"
echo ""
echo "📊 Server URLs:"
echo "   Frontend: http://localhost:3001"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend/backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "================================================"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
