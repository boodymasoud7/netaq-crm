#!/bin/bash

# ================================
# CRM System - Quick Setup Script
# For first-time deployment to AWS EC2
# ================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🚀 Netaq CRM System - Quick Setup Script"
echo "========================================"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "Please run this script as a regular user (not root)"
   exit 1
fi

# 1. Update system
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18
log_info "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PostgreSQL
log_info "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# 4. Install PM2 globally
log_info "Installing PM2..."
sudo npm install -g pm2

# 5. Install Nginx
log_info "Installing Nginx..."
sudo apt install -y nginx

# 6. Setup PostgreSQL database
log_info "Setting up PostgreSQL database..."
DB_PASSWORD="A7ayaman@@"

sudo -u postgres psql << EOF
CREATE DATABASE crm_production;
CREATE USER crmadmin WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE crm_production TO crmadmin;
ALTER USER crmadmin CREATEDB;
\q
EOF

log_success "Database created with password: $DB_PASSWORD"

# 7. Clone repository (if not exists)
if [ ! -d "/home/ubuntu/crm" ]; then
    log_info "Repository will be cloned by GitHub Actions..."
    mkdir -p /home/ubuntu/crm
    mkdir -p /home/ubuntu/backups
    mkdir -p /home/ubuntu/crm/logs
fi

# 8. Create .env file template
log_info "Creating environment configuration..."
cat > /home/ubuntu/crm/.env.production << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_production
DB_USER=crmadmin
DB_PASSWORD=A7ayaman@@
DB_DIALECT=postgres

# Server Configuration
NODE_ENV=production
PORT=8000
FRONTEND_URL=https://www.netaqcrm.site

# Security (CHANGE THESE!)
JWT_SECRET=$(openssl rand -base64 64)
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=warn
ENABLE_LOGGING=true

# Rate Limiting
RATE_LIMIT_MAX=300

# File Uploads
MAX_FILE_SIZE=10
UPLOAD_DIR=/home/ubuntu/crm/uploads

# Backup
BACKUP_DIR=/home/ubuntu/backups
BACKUP_RETENTION_DAYS=7
EOF

# 9. Setup Nginx configuration
log_info "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/crm > /dev/null << EOF
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Frontend (static files)
    location / {
        root /home/ubuntu/crm/crm-frontend-only/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
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
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8000/api/health;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 10. Test and restart Nginx
sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx

# 11. Configure PM2 startup
log_info "Configuring PM2 for auto-startup..."
pm2 startup | grep -E '^sudo' | bash || true

# 12. Setup firewall
log_info "Configuring UFW firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8000  # Allow direct backend access for debugging

# 13. Create useful scripts
log_info "Creating utility scripts..."

# Status check script
cat > /home/ubuntu/status.sh << 'EOF'
#!/bin/bash
echo "🔍 CRM System Status"
echo "==================="
echo "📊 PM2 Processes:"
pm2 list
echo ""
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""
echo "🗄️ PostgreSQL Status:"
sudo systemctl status postgresql --no-pager -l
echo ""
echo "💾 Disk Usage:"
df -h /
echo ""
echo "🧠 Memory Usage:"
free -h
echo ""
echo "🔗 Network Connections:"
netstat -tlnp | grep -E ':80|:8000|:5432'
EOF
chmod +x /home/ubuntu/status.sh

# Quick deploy script
cat > /home/ubuntu/quick-deploy.sh << 'EOF'
#!/bin/bash
echo "🚀 Quick Deploy..."
cd /home/ubuntu/crm
git pull origin main
cd crm-backend && npm install --only=production
cd ../crm-frontend-only && npm install && npm run build
cd ../crm-backend && npx sequelize-cli db:migrate --env production || true
pm2 reload crm-backend || pm2 start ecosystem.config.js --env production
sudo systemctl reload nginx
echo "✅ Deploy completed!"
EOF
chmod +x /home/ubuntu/quick-deploy.sh

# 14. Set proper permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/crm /home/ubuntu/backups
chmod +x /home/ubuntu/*.sh

# 15. Final status
log_success "🎉 Netaq CRM Setup completed successfully!"
echo ""
echo "📋 Summary:"
echo "============"
echo "🌐 Server IP: 54.221.136.112"
echo "🌐 Domain: www.netaqcrm.site"
echo "🗄️ Database: crm_production"
echo "👤 DB User: crmadmin" 
echo "🔑 DB Password: A7ayaman@@"
echo ""
echo "📁 Important files:"
echo "   - Environment: /home/ubuntu/crm/.env.production"
echo "   - Nginx config: /etc/nginx/sites-available/crm"
echo "   - PM2 logs: /home/ubuntu/crm/logs/"
echo ""
echo "🔧 Useful commands:"
echo "   - Status check: ./status.sh"
echo "   - Quick deploy: ./quick-deploy.sh"
echo "   - PM2 logs: pm2 logs crm-backend"
echo "   - PM2 monitor: pm2 monit"
echo ""
echo "🚀 Next steps:"
echo "1. Update GitHub repository secrets with:"
echo "   EC2_HOST = 54.221.136.112"
echo "   EC2_USER = ubuntu"
echo "   EC2_KEY = [your-private-key-content]"
echo ""
echo "2. Push your code to GitHub - it will auto-deploy!"
echo ""
echo "3. Access Netaq CRM at: https://www.netaqcrm.site"
log_success "Ready for production! 🎊"
