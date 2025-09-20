'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('reminders');
    
    if (!tableDescription.notified) {
      await queryInterface.addColumn('reminders', 'notified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'هل تم إشعار المستخدم'
      });
      
      console.log('✅ Added notified column to Reminders table');
    } else {
      console.log('ℹ️ Column notified already exists in Reminders table');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('reminders', 'notified');
  }
};

