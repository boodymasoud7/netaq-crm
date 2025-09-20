const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const config = require('./config/config.json');

const sequelize = new Sequelize(config.development);

async function runSQLFix() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // قراءة SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'fix-reminders-columns.sql'), 'utf-8');
    console.log('📂 SQL script loaded');

    // تشغيل الـ script
    console.log('🔧 Running SQL script...');
    await sequelize.query(sqlScript);
    console.log('✅ SQL script executed successfully');

    // التحقق من النتيجة
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'simple_reminders' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Updated table structure:');
    results.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${col.column_default ? `default: ${col.column_default}` : ''}`);
    });

    console.log('\n🎉 Database update completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.parent) {
      console.error('   SQL Error:', error.parent.message);
    }
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

runSQLFix();









