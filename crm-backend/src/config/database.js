const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'crm_database',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    // For production with SSL
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
};

// Create Sequelize instance
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    return false;
  }
};

// Sync database tables
const syncDatabase = async (force = false) => {
  try {
    console.log('🔄 Syncing database tables...');
    
    // Import models to ensure they are loaded
    const { sequelize: modelSequelize } = require('../../models');
    
    // Disable sync to avoid index conflicts - use migrations instead
    console.log('⚠️ Database sync disabled - using migrations for schema changes');
    console.log('✅ Database tables sync skipped (using migrations).');
    return true;
    
    // Uncomment below if you want to enable sync (after fixing index conflicts)
    // await modelSequelize.sync({ force, alter: !force });
    // console.log('✅ Database tables synced successfully.');
    // return true;
  } catch (error) {
    console.error('❌ Error syncing database tables:', error.message);
    console.log('⚠️ Database table sync failed');
    return false;
  }
};

// Close connection
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
  config
};

