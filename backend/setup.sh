#!/bin/bash

# Smart Irrigation Assistant - Development Setup Script

set -e

echo "🌱 Setting up Smart Irrigation Assistant Backend..."

# Check if Python 3.11+ is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
if [[ $(echo "$PYTHON_VERSION < 3.11" | bc -l) -eq 1 ]]; then
    echo "❌ Python version $PYTHON_VERSION detected. Please install Python 3.11 or higher."
    exit 1
fi

echo "✅ Python $PYTHON_VERSION detected"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy environment file
echo "⚙️ Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Please edit .env file with your API keys and database configuration"
fi

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "🐳 Docker detected"
    
    # Check if docker-compose is available
    if command -v docker-compose &> /dev/null; then
        echo "🚀 Starting development services with Docker Compose..."
        docker-compose up -d db redis
        echo "⏳ Waiting for services to be ready..."
        sleep 10
    else
        echo "📝 Docker Compose not found. You can manually start PostgreSQL and Redis."
    fi
else
    echo "📝 Docker not found. Please install Docker or set up PostgreSQL and Redis manually."
fi

# Run database migrations
echo "🗄️ Setting up database..."
if [ -f .env ]; then
    source .env
    if [ ! -z "$DATABASE_URL" ]; then
        echo "Running database migrations..."
        alembic upgrade head
    else
        echo "⚠️ DATABASE_URL not set in .env file"
    fi
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your API keys"
echo "2. Make sure PostgreSQL and Redis are running"
echo "3. Run 'source venv/bin/activate' to activate the virtual environment"
echo "4. Run 'python main.py' to start the development server"
echo "5. Visit http://localhost:8000/docs for API documentation"
echo ""
echo "For production deployment, see README.md"
