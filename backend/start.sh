#!/bin/bash

# Smart Irrigation Assistant - Quick Start Script

set -e

echo "🚀 Starting Smart Irrigation Assistant..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "⚠️  No virtual environment found. Run ./setup.sh first or create one manually."
fi

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
fi

# Start the development server
echo "🌟 Starting development server..."
echo "📄 API Documentation will be available at: http://localhost:8000/docs"
echo "🏥 Health check: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python main.py
