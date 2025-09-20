#!/bin/bash

# 🚀 Netaq CRM - Manual Deployment Script
# Usage: ./manual-deploy.sh

set -e  # Exit on any error

echo "🚀 Starting Netaq CRM Manual Deployment..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Project directory
PROJECT_DIR="/var/www/netaq-crm"

# Clone or update repository
if [ -d "$PROJECT_DIR" ]; then
    print_status "Updating existing repository..."
    cd $PROJECT_DIR
    git pull origin main
else
    print_status "Cloning repository..."
    cd /var/www
    git clone https://github.com/boodymasoud7/netaq-crm.git
    cd $PROJECT_DIR
fi

# Setup backend
print_status "Setting up backend..."
cd $PROJECT_DIR/crm-backend

# Copy environment file
if [ ! -f .env ]; then
    print_status "Creating backend environment file..."
    cp ../scripts/env.template .env
    
    # Update database password
    sed -i 's/your_secure_password_here/Netaq@2025#CRM/g' .env
    sed -i 's/your_email@gmail.com/netaqcrm@gmail.com/g' .env
    sed -i 's/your_app_password/NetaqCRM2025/g' .env
    
    print_warning "Please review and update .env file with correct values!"
fi

# Install backend dependencies
npm ci --production

# Run database migrations
print_status "Running database migrations..."
npx sequelize-cli db:migrate

# Setup frontend
print_status "Setting up frontend..."
cd $PROJECT_DIR/crm-frontend-only

# Copy environment file
if [ ! -f .env ]; then
    print_status "Creating frontend environment file..."
    cp ../scripts/frontend-env.example .env
fi

# Install frontend dependencies and build
npm ci
npm run build

# Setup PM2 for backend
print_status "Setting up PM2 for backend..."
cd $PROJECT_DIR/crm-backend

# Create PM2 ecosystem file
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'netaq-crm-backend',
    script: 'server.js',
    cwd: '/var/www/netaq-crm/crm-backend',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Stop existing processes
pm2 delete netaq-crm-backend 2>/dev/null || true

# Start the application
pm2 start ecosystem.config.js

# Save PM2 processes
pm2 save

# Test the application
print_status "Testing application..."
sleep 5

if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    print_status "Backend is running successfully!"
else
    print_error "Backend health check failed!"
    pm2 logs netaq-crm-backend --lines 20
fi

# Check frontend build
if [ -f "$PROJECT_DIR/crm-frontend-only/dist/index.html" ]; then
    print_status "Frontend built successfully!"
else
    print_error "Frontend build failed!"
fi

print_status "Deployment completed successfully!"
print_status "=================================="
print_status "Backend: http://54.221.136.112:8000"
print_status "Frontend: http://54.221.136.112"
print_status "=================================="

# Show PM2 status
pm2 list
