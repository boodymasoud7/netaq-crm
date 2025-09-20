const { sequelize } = require('./models');

async function setupLocalDatabase() {
  try {
    console.log('🔄 إعداد قاعدة البيانات المحلية...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // Create tables
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ تم إنشاء الجداول بنجاح');
    
    // Check tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 الجداول المتوفرة:');
    results.forEach(row => console.log(`  ✅ ${row.table_name}`));
    
    console.log('🎉 قاعدة البيانات المحلية جاهزة!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ خطأ في إعداد قاعدة البيانات:', error.message);
    console.log('\n💡 تأكد من:');
    console.log('   - تشغيل PostgreSQL محلياً');
    console.log('   - إنشاء قاعدة البيانات: crm_development');
    console.log('   - إنشاء المستخدم: crm_dev بكلمة المرور: 123456');
    process.exit(1);
  }
}

setupLocalDatabase();

