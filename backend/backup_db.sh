#!/bin/bash

# Smart Irrigation Assistant - Database Backup Script

set -e

# Configuration
BACKUP_DIR="./backup"
DB_NAME="smart_irrigation_db"
DB_USER="smart_irrigation_user"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/smart_irrigation_backup_$TIMESTAMP.sql"

echo "🗄️ Starting database backup..."

# Create backup using docker-compose
if [ -f "docker-compose.prod.yml" ]; then
    echo "📦 Using production Docker setup..."
    docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_FILE
elif [ -f "docker-compose.yml" ]; then
    echo "🔧 Using development Docker setup..."
    docker-compose exec -T db pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_FILE
else
    echo "❌ No docker-compose file found. Please ensure Docker Compose is set up."
    exit 1
fi

# Compress backup
echo "🗜️ Compressing backup..."
gzip $BACKUP_FILE
BACKUP_FILE="$BACKUP_FILE.gz"

# Verify backup was created
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Clean up old backups (keep only last 30 days)
echo "🧹 Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "smart_irrigation_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List current backups
echo ""
echo "📋 Current backups:"
ls -lh $BACKUP_DIR/smart_irrigation_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo ""
echo "✅ Backup process completed!"
echo "Backup file: $BACKUP_FILE"
