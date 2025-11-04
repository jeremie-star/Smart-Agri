#!/bin/bash

# Smart Irrigation Assistant - Production Deployment Script

set -e

echo "🚀 Deploying Smart Irrigation Assistant to Production..."

# Check if required files exist
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found. Please create it with production settings."
    exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ docker-compose.prod.yml file not found."
    exit 1
fi

# Load production environment variables
export $(cat .env.production | grep -v ^# | xargs)

# Validate required environment variables
REQUIRED_VARS=(
    "DB_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "OPENWEATHER_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Create necessary directories
mkdir -p logs/nginx
mkdir -p backup
mkdir -p ssl

echo "📁 Directories created"

# Check if SSL certificates exist
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "⚠️ SSL certificates not found in ssl/ directory"
    echo "Please add your SSL certificates:"
    echo "  - ssl/cert.pem (SSL certificate)"
    echo "  - ssl/key.pem (Private key)"
    read -p "Continue without SSL? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Build application image
echo "🔨 Building application image..."
docker-compose -f docker-compose.prod.yml build

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.prod.yml down

# Start services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T web alembic upgrade head

# Check service health
echo "🏥 Checking service health..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "unhealthy"; then
    echo "❌ Some services are unhealthy:"
    docker-compose -f docker-compose.prod.yml ps
    exit 1
fi

echo "✅ All services are healthy"

# Display status
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Services status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "Application URLs:"
echo "  - HTTPS: https://yourdomain.com"
echo "  - HTTP: http://yourdomain.com (redirects to HTTPS)"
echo "  - Health Check: https://yourdomain.com/health"

echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  - Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "  - Update application: ./deploy.sh"

echo ""
echo "📊 Monitoring:"
echo "  - Check application logs: docker-compose -f docker-compose.prod.yml logs -f web"
echo "  - Check database logs: docker-compose -f docker-compose.prod.yml logs -f db"
echo "  - Check nginx logs: tail -f logs/nginx/access.log"
