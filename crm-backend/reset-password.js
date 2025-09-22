const { User } = require('./models');
const bcrypt = require('bcrypt');

async function resetPassword() {
  try {
    const admin = await User.findOne({ where: { email: 'admin@gmail.com' } });
    
    if (!admin) {
      console.log('❌ المستخدم غير موجود');
      return;
    }
    
    // تشفير كلمة مرور جديدة
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await admin.update({ 
      password: hashedPassword,
      isActive: true,
      status: 'active'
    });
    
    console.log('✅ تم تحديث كلمة المرور بنجاح!');
    console.log('Email: admin@gmail.com');
    console.log('Password: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

resetPassword();
