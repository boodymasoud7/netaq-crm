'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Syncing projects_count for all developers...');
      
      // Update projects_count based on Projects table
      await queryInterface.sequelize.query(`
        UPDATE developers d
        SET projects_count = (
          SELECT COUNT(*)
          FROM "Projects" p
          WHERE p.developer = d.name 
          AND p.deleted_at IS NULL
        )
        WHERE d.deleted_at IS NULL;
      `);
      
      console.log('✅ Successfully synced projects_count for all developers');
    } catch (error) {
      console.error('❌ Error syncing projects_count:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Reset all projects_count to 0
    await queryInterface.sequelize.query(`
      UPDATE developers 
      SET projects_count = 0 
      WHERE deleted_at IS NULL;
    `);
  }
};

