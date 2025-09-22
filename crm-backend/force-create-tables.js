const { sequelize } = require('./models');

async function createAllTables() {
  try {
    console.log('🔄 جاري إنشاء كل الجداول...');
    
    // Force sync all models
    await sequelize.sync({ force: false, alter: true });
    
    console.log('✅ تم إنشاء كل الجداول بنجاح!');
    
    // Check tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 الجداول المنشأة:');
    results.forEach(row => console.log(`  ✅ ${row.table_name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

createAllTables();
