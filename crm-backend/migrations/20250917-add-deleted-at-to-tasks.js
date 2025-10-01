'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('Tasks');
    if (tableDescription.deleted_at) {
      console.log('✅ deleted_at column already exists in Tasks table');
      return;
    }
    
    await queryInterface.addColumn('Tasks', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    console.log('✅ Added deleted_at column to Tasks table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tasks', 'deleted_at');
    console.log('✅ Removed deleted_at column from Tasks table');
  }
};







