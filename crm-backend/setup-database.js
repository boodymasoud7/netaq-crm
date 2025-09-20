const { sequelize } = require('./models');

async function setupDatabase() {
  try {
    console.log('🔄 جاري إعداد قاعدة البيانات...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    
    // Get all tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    const tableNames = results.map(row => row.table_name);
    console.log('📋 الجداول الموجودة:', tableNames);
    
    // Check if FollowUps table exists
    const followUpsExists = tableNames.includes('FollowUps');
    console.log(`📌 جدول FollowUps موجود؟ ${followUpsExists ? '✅ نعم' : '❌ لا'}`);
    
    // Final verification
    const finalCheck = tableNames.includes('FollowUps');
    console.log(`🎯 التحقق النهائي: جدول FollowUps موجود؟ ${finalCheck ? '✅ نعم' : '❌ لا'}`);
    
    console.log('🎉 تم إعداد قاعدة البيانات بنجاح!');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ في إعداد قاعدة البيانات:', error);
    return false;
  }
}

module.exports = { setupDatabase };