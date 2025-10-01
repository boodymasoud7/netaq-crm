'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('developers');
    if (tableDescription.deleted_at) {
      console.log('✅ deleted_at column already exists in developers table');
      return;
    }
    
    await queryInterface.addColumn('developers', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    console.log('✅ Added deleted_at column to developers table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('developers', 'deleted_at');
    console.log('✅ Removed deleted_at column from developers table');
  }
};







