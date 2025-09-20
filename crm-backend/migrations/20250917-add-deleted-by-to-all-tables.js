'use strict';

const tables = [
  'Clients', 'Leads', 'Sales', 'Projects', 'Units', 'developers', 
  'FollowUps', 'Tasks', 'simple_reminders'
];

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('⚙️ Adding deleted_by column to all soft-delete tables...');
    
    for (const table of tables) {
      try {
        // Check if column already exists
        const tableDescription = await queryInterface.describeTable(table);
        if (tableDescription.deleted_by) {
          console.log(`✅ deleted_by column already exists in ${table} table`);
          continue;
        }
        
        await queryInterface.addColumn(table, 'deleted_by', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'Users',
            key: 'id'
          },
          comment: 'User ID who deleted this record'
        });
        
        console.log(`✅ Added deleted_by column to ${table} table`);
      } catch (error) {
        console.error(`❌ Error adding deleted_by to ${table}:`, error.message);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('⚙️ Removing deleted_by column from all tables...');
    
    for (const table of tables) {
      try {
        await queryInterface.removeColumn(table, 'deleted_by');
        console.log(`✅ Removed deleted_by column from ${table} table`);
      } catch (error) {
        console.error(`❌ Error removing deleted_by from ${table}:`, error.message);
      }
    }
  }
};







