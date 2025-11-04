#!/bin/bash

# Smart Irrigation Assistant - Test Runner

set -e

echo "🧪 Running Smart Irrigation Assistant Tests..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
fi

# Install test dependencies if not already installed
pip install pytest pytest-asyncio pytest-cov httpx-mock

# Run tests with coverage
echo "🏃 Running tests with coverage..."
pytest tests/ -v --cov=app --cov-report=html --cov-report=term-missing

# Check if coverage report was generated
if [ -d "htmlcov" ]; then
    echo "📊 Coverage report generated in htmlcov/"
    echo "Open htmlcov/index.html in your browser to view detailed coverage"
fi

# Run linting (if tools are installed)
echo "🔍 Running code quality checks..."

if command -v black &> /dev/null; then
    echo "Running Black formatter check..."
    black --check app/ || echo "⚠️ Code formatting issues found. Run 'black app/' to fix."
else
    echo "📝 Install 'black' for code formatting: pip install black"
fi

if command -v flake8 &> /dev/null; then
    echo "Running Flake8 linter..."
    flake8 app/ --max-line-length=88 --extend-ignore=E203,W503 || echo "⚠️ Linting issues found."
else
    echo "📝 Install 'flake8' for linting: pip install flake8"
fi

if command -v isort &> /dev/null; then
    echo "Running isort import check..."
    isort --check-only app/ || echo "⚠️ Import sorting issues found. Run 'isort app/' to fix."
else
    echo "📝 Install 'isort' for import sorting: pip install isort"
fi

echo "✅ Test run complete!"
