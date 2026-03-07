#!/bin/bash

# AIDP Development Startup Script

echo "Starting AIDP Management System..."

# Start Backend
echo "Starting Backend Server..."
cd backend
python run.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
echo "Starting Frontend Server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "AIDP Management System is running!"
echo "=========================================="
echo "Backend API: http://7.250.75.172:8000"
echo "API Docs:   http://7.250.75.172:8000/api/docs"
echo "Frontend:   http://7.250.75.172:5173"
echo ""
echo "Also accessible via localhost:"
echo "Backend API: http://localhost:8000"
echo "Frontend:   http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=========================================="

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait
