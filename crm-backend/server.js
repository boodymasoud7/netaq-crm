require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection, syncDatabase } = require('./src/config/database');
const { setupDatabase } = require('./setup-database');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const clientRoutes = require('./src/routes/clients');
const leadRoutes = require('./src/routes/leads');
const projectRoutes = require('./src/routes/projects');
const developerRoutes = require('./src/routes/developers_new');
const unitRoutes = require('./src/routes/units_new');
const saleRoutes = require('./src/routes/sales');
const taskRoutes = require('./src/routes/tasks');
const reminderRoutes = require('./src/routes/reminders');
const noteRoutes = require('./src/routes/notes');
const notificationRoutes = require('./src/routes/notifications');
const interactionRoutes = require('./src/routes/interactions');
const statsRoutes = require('./src/routes/stats');
const backupRoutes = require('./src/routes/backups');
const followUpRoutes = require('./src/routes/followUps');
const dashboardRoutes = require('./src/routes/dashboard');
const hasDataRoutes = require("./src/routes/hasData");
// const monitorRoutes = require('./src/routes/monitor');

// Initialize backup cron jobs
const cronJobs = require('./src/services/cronJobs');

// Initialize reminder cron job
const { startReminderJob } = require('./src/cron/reminderJob');

const app = express();
const PORT = process.env.PORT || 8000;

// Rate limiting - relaxed for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5000 : 10000, // 10k requests in dev, 300 in prod
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.url.includes('/health') || req.url.includes('/api/test')
  }
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:4173', 'https://netaqcrm.site', 'https://www.netaqcrm.site', process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Dev-User-Id'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CRM Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/has-data', hasDataRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/archive', require('./src/routes/archive'));
app.use('/api/whatsapp', require('./src/routes/whatsapp'));
// Simple Reminders Route (if exists)
try {
  app.use('/api/simple-reminders', require('./src/routes/simpleReminders'));
  console.log('✅ Simple Reminders API loaded');
} catch (err) {
  console.log('⚠️ Simple Reminders API not found, skipping...');
}
// app.use('/api/monitor', monitorRoutes);

// Notification CRUD APIs
app.use('/api/notifications', notificationRoutes);

// إشعارات SSE
const notificationStreamRoutes = require('./src/routes/notifications-stream');
app.use('/api/notifications-stream', notificationStreamRoutes);

// Health check route (no auth required)
app.use('/api/health', require('./src/routes/health'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working perfectly!',
    environment: process.env.NODE_ENV || 'development',
    database: 'PostgreSQL 16.10',
    features: ['Authentication', 'Database', 'Security', 'CRUD APIs', 'Role-based Access']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, async () => {
  console.log(`🚀 CRM Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  
  // Test database connection
  console.log('\n🔍 Testing database connection...');
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('🗄️ PostgreSQL database is ready!');
    
    // Setup database (create missing tables)
    console.log('\n📊 Setting up database...');
    const setupSuccess = await setupDatabase();
    if (setupSuccess) {
      console.log('✅ Database setup completed successfully!');
      
      // Sync database tables
      console.log('\n📊 Syncing database tables...');
      const tablesSync = await syncDatabase(false); // Alter tables to match models
      if (tablesSync) {
        console.log('✅ All database tables are ready!');
        
        // بدء تشغيل خدمة التذكيرات - معطل مؤقتاً
        // console.log('🔔 Starting reminder cron job...');
        // startReminderJob();
        
        console.log('📁 All services are ready');
      } else {
        console.log('⚠️ Database table sync failed');
      }
    } else {
      console.log('⚠️ Database setup failed');
    }
  } else {
    console.log('⚠️ Database connection failed - check configuration');
  }
});

module.exports = app;


