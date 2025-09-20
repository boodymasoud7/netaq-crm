#!/bin/bash

# CRM Deployment Script
# Usage: ./scripts/deploy.sh [production|staging]

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
APP_DIR="/home/ubuntu/crm"

echo "🚀 Starting deployment to $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on the server
if [ ! -d "/home/ubuntu" ]; then
    log_error "This script should run on the EC2 server"
    exit 1
fi

# Create backup directory
mkdir -p $BACKUP_DIR

# 1. Backup current version
log_info "Creating backup of current version..."
if [ -d "$APP_DIR" ]; then
    tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C /home/ubuntu crm/
    log_success "Backup created: backup_$TIMESTAMP.tar.gz"
else
    log_warning "No existing installation found, skipping backup"
fi

# 2. Stop services gracefully
log_info "Stopping services..."
pm2 stop crm-backend || true
sudo systemctl stop nginx || true

# 3. Database backup
log_info "Creating database backup..."
DB_NAME=${DB_NAME:-crm_production}
DB_USER=${DB_USER:-crmadmin}
pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
log_success "Database backup created"

# 4. Update application code (this assumes code is already pulled)
log_info "Installing backend dependencies..."
cd $APP_DIR/crm-backend
npm install --only=production

# 5. Build frontend
log_info "Building frontend..."
cd $APP_DIR/crm-frontend-only
npm install
npm run build

# 6. Run database migrations
log_info "Running database migrations..."
cd $APP_DIR/crm-backend
npx sequelize-cli db:migrate --env $ENVIRONMENT

# 7. Update configuration files
log_info "Updating configuration files..."
if [ ! -f "$APP_DIR/crm-backend/.env" ]; then
    log_warning ".env file not found, copying template..."
    cp $APP_DIR/scripts/.env.template $APP_DIR/crm-backend/.env
    log_warning "Please update .env file with your production values"
fi

# 8. Set correct permissions
log_info "Setting permissions..."
sudo chown -R ubuntu:ubuntu $APP_DIR
chmod +x $APP_DIR/scripts/*.sh

# 9. Update nginx configuration
log_info "Updating nginx configuration..."
sudo cp $APP_DIR/scripts/nginx.conf /etc/nginx/sites-available/crm
sudo ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/

# 10. Start services
log_info "Starting services..."
cd $APP_DIR/crm-backend
pm2 start ecosystem.config.js --env $ENVIRONMENT || pm2 reload crm-backend
pm2 save

# Test nginx config and restart
sudo nginx -t && sudo systemctl reload nginx

# 11. Health check
log_info "Performing health check..."
sleep 10

if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    log_success "Health check passed - Backend is running"
else
    log_error "Health check failed - Backend is not responding"
    
    # Rollback option
    read -p "Do you want to rollback to previous version? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Rolling back..."
        $APP_DIR/scripts/rollback.sh $TIMESTAMP
        exit 1
    fi
fi

# 12. Clean old backups (keep last 5)
log_info "Cleaning old backups..."
cd $BACKUP_DIR
ls -t backup_*.tar.gz | tail -n +6 | xargs rm -f || true
ls -t db_backup_*.sql.gz | tail -n +6 | xargs rm -f || true

# 13. Show status
log_info "Deployment status:"
pm2 list
sudo systemctl status nginx --no-pager -l

log_success "🎉 Deployment completed successfully!"
log_info "Application is running at:"
log_info "- Backend: http://$(curl -s http://checkip.amazonaws.com/):8000"
log_info "- Frontend: http://$(curl -s http://checkip.amazonaws.com/)"

# Optional: Send notification
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ CRM deployed successfully to $ENVIRONMENT\"}" \
        $SLACK_WEBHOOK || true
fi





