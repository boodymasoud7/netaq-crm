#!/bin/bash

# Script to update production URLs
# Usage: ./scripts/update-production-urls.sh your-domain.com your-ec2-ip

DOMAIN=$1
EC2_IP=$2

if [ -z "$DOMAIN" ] || [ -z "$EC2_IP" ]; then
    echo "Usage: $0 <domain> <ec2-ip>"
    echo "Example: $0 mycrm.com 54.123.45.67"
    exit 1
fi

echo "🔧 Updating production URLs..."
echo "Domain: $DOMAIN"
echo "EC2 IP: $EC2_IP"

# Update frontend environment
echo "📝 Updating frontend environment..."
cat > crm-frontend-only/.env.production << EOF
VITE_API_URL=https://$DOMAIN/api
VITE_APP_NAME=CRM Real Estate System
VITE_APP_VERSION=2.0.0
EOF

# Update frontend config
sed -i "s|BACKEND_URL:.*|BACKEND_URL: 'https://$DOMAIN/api',|" crm-frontend-only/src/config/environment.js
sed -i "s|API_BASE_URL:.*|API_BASE_URL: 'https://$DOMAIN/api',|" crm-frontend-only/src/config/app.js

# Update backend CORS
sed -i "s|'http://localhost:3000'|'https://$DOMAIN'|g" crm-backend/server.js
sed -i "s|'http://localhost:5173'|'https://www.$DOMAIN'|g" crm-backend/server.js

# Update nginx config
sed -i "s|server_name .*|server_name $DOMAIN www.$DOMAIN;|" scripts/nginx.conf

# Update GitHub Actions
sed -i "s|EC2_HOST:.*|EC2_HOST: $EC2_IP|" .github/workflows/deploy.yml

# Update environment template
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|" scripts/env.template

# Update all service URLs in frontend
find crm-frontend-only/src -name "*.js" -o -name "*.jsx" | xargs sed -i "s|http://localhost:8000|https://$DOMAIN|g"

echo "✅ URLs updated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Commit and push changes"
echo "2. Update /home/ubuntu/.env on server with FRONTEND_URL=https://$DOMAIN"
echo "3. Update nginx config on server: sudo cp /home/ubuntu/crm/scripts/nginx.conf /etc/nginx/sites-available/crm"
echo "4. Test nginx config: sudo nginx -t"
echo "5. Reload nginx: sudo systemctl reload nginx"
echo "6. Setup SSL: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"





