console.log('🚀 Starting CRM Backend...');

// Check if all required dependencies are available
const requiredModules = [
  'express',
  'cors',
  'helmet',
  'express-rate-limit',
  'dotenv',
  'sequelize',
  'pg'
];

console.log('📦 Checking dependencies...');
requiredModules.forEach(module => {
  try {
    require(module);
    console.log(`✅ ${module} - OK`);
  } catch (error) {
    console.log(`❌ ${module} - MISSING: ${error.message}`);
  }
});

console.log('\n🗄️ Checking database models...');
try {
  const models = require('./models/index.js');
  console.log(`✅ Models loaded: ${Object.keys(models).length} models`);
} catch (error) {
  console.log(`❌ Models error: ${error.message}`);
}

console.log('\n🎮 Checking controllers...');
try {
  const dashboardController = require('./src/controllers/dashboardController.js');
  console.log(`✅ Dashboard controller loaded`);
} catch (error) {
  console.log(`❌ Dashboard controller error: ${error.message}`);
}

console.log('\n🌐 Starting Express server...');
try {
  require('./server.js');
} catch (error) {
  console.log(`❌ Server startup error: ${error.message}`);
  console.log('Full error:', error);
}









