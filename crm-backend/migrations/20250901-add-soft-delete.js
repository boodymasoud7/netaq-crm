'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add deleted_at column to all main tables for soft delete
    const tables = ['Clients', 'Leads', 'Projects', 'Sales', 'Tasks', 'Reminders', 'Notes', 'Interactions'];
    
    for (const table of tables) {
      try {
        await queryInterface.addColumn(table, 'deleted_at', {
          type: Sequelize.DATE,
          allowNull: true,
          defaultValue: null
        });
        console.log(`✅ Added deleted_at column to ${table}`);
      } catch (error) {
        console.log(`⚠️ Column deleted_at may already exist in ${table} or table doesn't exist:`, error.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove deleted_at column from all tables
    const tables = ['Clients', 'Leads', 'Projects', 'Sales', 'Tasks', 'Reminders', 'Notes', 'Interactions'];
    
    for (const table of tables) {
      try {
        await queryInterface.removeColumn(table, 'deleted_at');
        console.log(`✅ Removed deleted_at column from ${table}`);
      } catch (error) {
        console.log(`⚠️ Could not remove deleted_at column from ${table}:`, error.message);
      }
    }
  }
};







