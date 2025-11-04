#!/bin/bash

# Smart Irrigation Assistant - Database Restore Script

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ Usage: $0 <backup_file>"
    echo "Example: $0 backup/smart_irrigation_backup_20241104_120000.sql.gz"
    echo ""
    echo "Available backups:"
    ls -lh backup/smart_irrigation_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="smart_irrigation_db"
DB_USER="smart_irrigation_user"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️ WARNING: This will replace all data in the database!"
echo "Backup file: $BACKUP_FILE"
echo "Database: $DB_NAME"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "🗄️ Starting database restore..."

# Extract backup if it's compressed
TEMP_FILE="$BACKUP_FILE"
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "📦 Extracting compressed backup..."
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
fi

# Stop application services to prevent database access
echo "🛑 Stopping application services..."
if [ -f "docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml stop web celery_worker celery_beat
elif [ -f "docker-compose.yml" ]; then
    docker-compose stop web celery_worker celery_beat
fi

# Restore database
echo "♻️ Restoring database..."
if [ -f "docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml exec -T db psql -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    docker-compose -f docker-compose.prod.yml exec -T db psql -U $DB_USER -d $DB_NAME < "$TEMP_FILE"
elif [ -f "docker-compose.yml" ]; then
    docker-compose exec -T db psql -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    docker-compose exec -T db psql -U $DB_USER -d $DB_NAME < "$TEMP_FILE"
else
    echo "❌ No docker-compose file found."
    exit 1
fi

# Clean up temporary file if we extracted it
if [[ $BACKUP_FILE == *.gz ]] && [ -f "$TEMP_FILE" ]; then
    rm "$TEMP_FILE"
fi

# Restart application services
echo "🚀 Restarting application services..."
if [ -f "docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml start web celery_worker celery_beat
elif [ -f "docker-compose.yml" ]; then
    docker-compose start web celery_worker celery_beat
fi

echo "✅ Database restore completed successfully!"
echo "🏥 Checking application health..."
sleep 10

# Health check
if command -v curl &> /dev/null; then
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Application is healthy"
    else
        echo "⚠️ Application health check failed. Please check the logs."
    fi
else
    echo "📝 Install curl to perform automatic health check"
fi
