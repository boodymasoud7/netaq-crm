# Netaq CRM - Deploy to Server Script
# PowerShell script to deploy to AWS EC2

$ServerIP = "54.221.136.112"
$KeyPath = "netaq-key.pem"  # Path to your private key file

Write-Host "🚀 Starting Netaq CRM deployment to AWS EC2..." -ForegroundColor Green

# Create SSH connection and run setup
$ScriptBlock = @"
    # Update system
    sudo apt update && sudo apt upgrade -y
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install PostgreSQL
    sudo apt install -y postgresql postgresql-contrib
    
    # Install PM2
    sudo npm install -g pm2
    
    # Install Nginx
    sudo apt install -y nginx
    
    # Setup database
    sudo -u postgres psql -c "CREATE DATABASE crm_production;"
    sudo -u postgres psql -c "CREATE USER crmadmin WITH ENCRYPTED PASSWORD 'A7ayaman@@';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE crm_production TO crmadmin;"
    sudo -u postgres psql -c "ALTER USER crmadmin CREATEDB;"
    
    # Clone repository
    git clone https://github.com/boodymasoud7/netaq-crm.git /home/ubuntu/crm
    cd /home/ubuntu/crm
    
    # Setup environment files
    cp scripts/env.template crm-backend/.env
    cp scripts/frontend-env.example crm-frontend-only/.env
    
    # Install backend dependencies
    cd crm-backend
    npm ci --only=production
    
    # Install frontend dependencies and build
    cd ../crm-frontend-only
    npm ci
    npm run build
    
    # Run database migrations
    cd ../crm-backend
    npx sequelize-cli db:migrate --env production
    npx sequelize-cli db:seed --seed 20250831192643-admin-user.js --env production
    
    # Configure Nginx
    sudo cp ../scripts/nginx.conf /etc/nginx/sites-available/crm
    sudo ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and restart Nginx
    sudo nginx -t && sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    # Start backend with PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup | grep -E '^sudo' | bash
    
    # Set permissions
    sudo chown -R ubuntu:ubuntu /home/ubuntu/crm
    chmod +x /home/ubuntu/crm/scripts/*.sh
    
    # Create utility scripts
    echo '#!/bin/bash
pm2 list
sudo systemctl status nginx --no-pager -l
sudo systemctl status postgresql --no-pager -l
df -h /
free -h' > /home/ubuntu/status.sh
    chmod +x /home/ubuntu/status.sh
    
    echo "✅ Netaq CRM deployment completed!"
    echo "🌐 Access at: http://$ServerIP"
    echo "🔧 Backend API: http://$ServerIP:8000"
"@

# Execute on server
ssh -i $KeyPath ubuntu@$ServerIP $ScriptBlock

Write-Host "🎉 Deployment completed! Visit: http://$ServerIP" -ForegroundColor Green
