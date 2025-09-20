// Find existing users
const { User } = require('./models');

async function findUsers() {
  try {
    const users = await User.findAll({
      limit: 5,
      attributes: ['id', 'name', 'email', 'role']
    });

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    console.log('👥 Found users:');
    users.forEach(user => {
      console.log(`   ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error finding users:', error);
    process.exit(1);
  }
}

findUsers();





