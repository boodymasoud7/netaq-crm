#!/bin/bash

# Initial Server Setup Script for CRM
# Run this script once on a fresh EC2 Ubuntu instance

set -e

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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info "🚀 Starting CRM server setup..."

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    log_error "This script should be run as ubuntu user"
    exit 1
fi

# 1. Update system
log_info "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install essential packages
log_info "📦 Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# 3. Install Node.js (using NodeSource repository)
log_info "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
log_success "Node.js installed: $node_version"
log_success "npm installed: $npm_version"

# 4. Install PostgreSQL
log_info "🗄️ Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 5. Configure PostgreSQL
log_info "🔧 Configuring PostgreSQL..."

# Create database and user
DB_NAME="crm_production"
DB_USER="crmadmin"
DB_PASSWORD="${1:-$(openssl rand -base64 32)}"

sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

# Update PostgreSQL configuration for remote connections
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host all all 0.0.0.0/0 md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

log_success "PostgreSQL configured with database: $DB_NAME, user: $DB_USER"

# 6. Install PM2
log_info "📦 Installing PM2..."
sudo npm install -g pm2

# Configure PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 7. Install Nginx
log_info "🌐 Installing Nginx..."
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 8. Configure firewall
log_info "🔒 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 8000/tcp  # Backend port
sudo ufw --force enable

# 9. Create application directories
log_info "📁 Creating application directories..."
mkdir -p /home/ubuntu/crm
mkdir -p /home/ubuntu/backups
mkdir -p /home/ubuntu/crm/logs

# Set correct ownership
sudo chown -R ubuntu:ubuntu /home/ubuntu/crm
sudo chown -R ubuntu:ubuntu /home/ubuntu/backups

# 10. Install SSL certificate tools (Let's Encrypt)
log_info "🔐 Installing SSL tools..."
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# 11. Configure Git (optional)
log_info "📝 Configuring Git..."
git config --global init.defaultBranch main
git config --global pull.rebase false

# 12. Create environment file template
log_info "📄 Creating environment file template..."
cat > /home/ubuntu/.env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Server Configuration
NODE_ENV=production
PORT=8000
FRONTEND_URL=http://$(curl -s http://checkip.amazonaws.com/)

# Security
JWT_SECRET=$(openssl rand -base64 64)
BCRYPT_ROUNDS=12

# Other settings
RATE_LIMIT_MAX=300
DEBUG_MODE=false
ENABLE_LOGGING=true
LOG_LEVEL=warn
EOF

# 13. Create deployment helper scripts
log_info "📄 Creating helper scripts..."

# Quick deploy script
cat > /home/ubuntu/quick-deploy.sh << 'EOF'
#!/bin/bash
cd /home/ubuntu/crm
git pull origin main
cd crm-backend && npm install --only=production
cd ../crm-frontend-only && npm run build
cd ../crm-backend
npx sequelize-cli db:migrate --env production
pm2 reload crm-backend
sudo systemctl reload nginx
echo "✅ Quick deployment completed!"
EOF

# Status check script
cat > /home/ubuntu/status.sh << 'EOF'
#!/bin/bash
echo "=== CRM Status ==="
echo "PM2 Processes:"
pm2 list
echo
echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo
echo "Database Status:"
sudo systemctl status postgresql --no-pager -l
echo
echo "Disk Usage:"
df -h
echo
echo "Memory Usage:"
free -h
echo
echo "Health Check:"
curl -f http://localhost:8000/api/health || echo "Backend not responding"
EOF

# Make scripts executable
chmod +x /home/ubuntu/quick-deploy.sh
chmod +x /home/ubuntu/status.sh

# 14. Setup log rotation
log_info "📊 Setting up log rotation..."
sudo tee /etc/logrotate.d/crm << EOF
/home/ubuntu/crm/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# 15. Final status check
log_info "🔍 Final status check..."
systemctl is-active --quiet postgresql && log_success "PostgreSQL is running" || log_error "PostgreSQL is not running"
systemctl is-active --quiet nginx && log_success "Nginx is running" || log_error "Nginx is not running"
command -v node >/dev/null 2>&1 && log_success "Node.js is installed" || log_error "Node.js is not installed"
command -v pm2 >/dev/null 2>&1 && log_success "PM2 is installed" || log_error "PM2 is not installed"

# Display important information
log_success "🎉 Server setup completed!"
echo
echo "=== IMPORTANT INFORMATION ==="
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password: $DB_PASSWORD"
echo "Server IP: $(curl -s http://checkip.amazonaws.com/)"
echo
echo "Environment file created at: /home/ubuntu/.env"
echo "Helper scripts created:"
echo "  - /home/ubuntu/quick-deploy.sh (for quick deployments)"
echo "  - /home/ubuntu/status.sh (for status checking)"
echo
echo "Next steps:"
echo "1. Update /home/ubuntu/.env with your settings"
echo "2. Set up your domain name in DNS"
echo "3. Configure SSL certificate with: sudo certbot --nginx"
echo "4. Clone your repository and run first deployment"
echo
log_warning "Please save the database password somewhere secure!"
log_warning "You may want to change the default database password"





