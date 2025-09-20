'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('simple_reminders', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    console.log('✅ Added deleted_at column to simple_reminders table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('simple_reminders', 'deleted_at');
    console.log('✅ Removed deleted_at column from simple_reminders table');
  }
};







