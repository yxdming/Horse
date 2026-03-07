#!/bin/bash

# AIDP Production Deployment Script

set -e

echo "Deploying AIDP Management System to Production..."

# Configuration
BACKEND_PORT=8000
FRONTEND_DIST="frontend/dist"
BACKEND_WORKERS=4

# Build Frontend
echo "Building Frontend..."
cd frontend
npm run build
cd ..

# Check if build was successful
if [ ! -d "$FRONTEND_DIST" ]; then
    echo "Error: Frontend build failed!"
    exit 1
fi

echo "Frontend built successfully!"

# Install backend dependencies if needed
echo "Checking backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing/Updating dependencies..."
pip install -r requirements.txt

cd ..

echo ""
echo "=========================================="
echo "Deployment Ready!"
echo "=========================================="
echo ""
echo "To start the production servers:"
echo ""
echo "1. Backend:"
echo "   cd backend"
echo "   source venv/bin/activate  # Linux/Mac"
echo "   uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --workers $BACKEND_WORKERS"
echo ""
echo "2. Frontend:"
echo "   Deploy $FRONTEND_DIST to your web server (nginx, apache, etc.)"
echo ""
echo "=========================================="
