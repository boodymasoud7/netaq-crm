#!/bin/bash

# 🚀 Netaq CRM - AWS Server Setup Script
# Usage: ./setup-aws-server.sh

set -e  # Exit on any error

echo "🚀 Starting Netaq CRM AWS Server Setup..."
echo "============================================"

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

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js installed: $node_version"
print_status "npm installed: $npm_version"

# Install PostgreSQL
print_status "Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
print_status "Setting up database..."
DB_PASSWORD="Netaq@2025#CRM"
sudo -u postgres psql -c "CREATE DATABASE crm_production;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER crmadmin WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE crm_production TO crmadmin;"
sudo -u postgres psql -c "ALTER USER crmadmin CREATEDB;"

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install Git
print_status "Installing Git..."
sudo apt install git -y

# Create project directory
print_status "Creating project directory..."
sudo mkdir -p /var/www/netaq-crm
sudo chown -R ubuntu:ubuntu /var/www/netaq-crm

# Generate SSH key for GitHub (if not exists)
if [ ! -f ~/.ssh/id_rsa ]; then
    print_status "Generating SSH key for GitHub..."
    ssh-keygen -t rsa -b 4096 -C "ubuntu@netaq-server" -f ~/.ssh/id_rsa -N ""
    print_warning "Add this public key to your GitHub account:"
    echo "----------------------------------------"
    cat ~/.ssh/id_rsa.pub
    echo "----------------------------------------"
    print_warning "Go to: https://github.com/settings/keys"
else
    print_status "SSH key already exists"
fi

# Configure Nginx for the app
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/netaq-crm > /dev/null <<EOF
server {
    listen 80;
    server_name 54.221.136.112 www.netaqcrm.site netaqcrm.site;

    # Frontend
    location / {
        root /var/www/netaq-crm/crm-frontend-only/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/netaq-crm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Install SSL certificate with Certbot
print_status "Installing Certbot for SSL..."
sudo apt install certbot python3-certbot-nginx -y

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 8000
sudo ufw --force enable

# Create PM2 startup script
print_status "Setting up PM2 startup..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

print_status "Server setup completed successfully!"
print_status "============================================"
print_status "Next steps:"
print_status "1. Add the SSH public key to GitHub"
print_status "2. Clone your repository to /var/www/netaq-crm"
print_status "3. Set up environment variables"
print_status "4. Run your first deployment"
print_status "============================================"

echo ""
print_warning "Database credentials:"
echo "Host: localhost"
echo "Database: crm_production" 
echo "User: crmadmin"
echo "Password: $DB_PASSWORD"
echo ""

print_warning "If you need SSL certificate, run:"
echo "sudo certbot --nginx -d netaqcrm.site -d www.netaqcrm.site"
