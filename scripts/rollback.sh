#!/bin/bash

# CRM Rollback Script
# Usage: ./scripts/rollback.sh [backup_timestamp]

set -e

BACKUP_TIMESTAMP=$1
BACKUP_DIR="/home/ubuntu/backups"
APP_DIR="/home/ubuntu/crm"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

if [ -z "$BACKUP_TIMESTAMP" ]; then
    log_info "Available backups:"
    ls -la $BACKUP_DIR/backup_*.tar.gz | tail -5
    echo
    read -p "Enter backup timestamp (YYYYMMDD_HHMMSS): " BACKUP_TIMESTAMP
fi

BACKUP_FILE="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP.tar.gz"
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$BACKUP_TIMESTAMP.sql.gz"

# Check if backup exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    log_info "Available backups:"
    ls -la $BACKUP_DIR/backup_*.tar.gz
    exit 1
fi

log_info "🔄 Starting rollback to backup: $BACKUP_TIMESTAMP"

# 1. Stop services
log_info "Stopping services..."
pm2 stop crm-backend || true
sudo systemctl stop nginx || true

# 2. Create current backup before rollback
CURRENT_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
log_info "Creating backup of current state..."
tar -czf "$BACKUP_DIR/pre_rollback_$CURRENT_TIMESTAMP.tar.gz" -C /home/ubuntu crm/

# 3. Restore application files
log_info "Restoring application files..."
cd /home/ubuntu
rm -rf crm/
tar -xzf "$BACKUP_FILE"

# 4. Restore database (optional)
if [ -f "$DB_BACKUP_FILE" ]; then
    read -p "Do you want to restore database as well? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restoring database..."
        DB_NAME=${DB_NAME:-crm_production}
        DB_USER=${DB_USER:-crmadmin}
        
        # Drop and recreate database
        dropdb -h localhost -U $DB_USER $DB_NAME || true
        createdb -h localhost -U $DB_USER $DB_NAME
        
        # Restore from backup
        gunzip -c "$DB_BACKUP_FILE" | psql -h localhost -U $DB_USER $DB_NAME
        log_success "Database restored"
    fi
fi

# 5. Reinstall dependencies
log_info "Installing dependencies..."
cd $APP_DIR/crm-backend
npm install --only=production

# 6. Start services
log_info "Starting services..."
pm2 start ecosystem.config.js --env production
pm2 save
sudo systemctl start nginx

# 7. Health check
log_info "Performing health check..."
sleep 10

if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    log_success "✅ Rollback completed successfully!"
    log_info "Application is running from backup: $BACKUP_TIMESTAMP"
else
    log_error "❌ Rollback failed - service is not responding"
    exit 1
fi

# Show status
pm2 list
sudo systemctl status nginx --no-pager -l





