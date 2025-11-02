#!/bin/bash
# Start script for Python Flask backend

cd "$(dirname "$0")"

echo "================================================"
echo "🐍 Starting Python Backend (Flask API)"
echo "================================================"

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "❌ Virtual environment not found!"
    echo "Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found, copying from .env.example"
    cp .env.example .env
fi

# Set memory-efficient Python options
export PYTHONUNBUFFERED=1
export FLASK_ENV=development

echo ""
echo "Starting Flask server on port 5000..."
echo "Endpoint: http://localhost:5000/api/analyze-document"
echo "Press Ctrl+C to stop"
echo ""

# Run with limited memory usage
python3 api_server.py
