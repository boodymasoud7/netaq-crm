module.exports = {
  apps: [{
    name: 'crm-backend',
    script: './server.js',
    cwd: '/home/ubuntu/crm/crm-backend',
    instances: 'max',
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 8000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    
    // Restart policy
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads', 'temp'],
    
    // Logging
    log_file: '/home/ubuntu/crm/logs/combined.log',
    out_file: '/home/ubuntu/crm/logs/out.log',
    error_file: '/home/ubuntu/crm/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced settings
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10,
    
    // Auto restart options
    autorestart: true,
    restart_delay: 4000,
    
    // Health monitoring
    health_check_url: 'http://localhost:8000/api/health',
    health_check_grace_period: 3000
  }],

    deploy: {
    production: {
      user: 'ubuntu',
      host: process.env.EC2_HOST,
      ref: 'origin/main',
      repo: 'git@github.com:boodymasoud7/netaq-crm.git',  // Netaq CRM Repository
      path: '/home/ubuntu/crm',
      'pre-deploy': 'git fetch origin',
      'post-deploy': 'cd crm-backend && npm ci --only=production && cd ../crm-frontend-only && npm ci && npm run build && cd ../crm-backend && npx sequelize-cli db:migrate --env production && pm2 reload ecosystem.config.js --env production && pm2 save',
      'pre-setup': 'apt update && apt install git -y'
    }
  }
};





