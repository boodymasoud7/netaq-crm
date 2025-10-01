'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('🔄 Normalizing developers status to English...');
      
      // Update all Arabic status values to English
      await queryInterface.sequelize.query(`
        UPDATE developers 
        SET status = 'active' 
        WHERE status = 'نشط' OR status IS NULL;
      `);
      
      await queryInterface.sequelize.query(`
        UPDATE developers 
        SET status = 'inactive' 
        WHERE status = 'غير نشط';
      `);
      
      console.log('✅ Successfully normalized all status values');
    } catch (error) {
      console.error('❌ Error normalizing status:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to Arabic values
    await queryInterface.sequelize.query(`
      UPDATE developers 
      SET status = 'نشط' 
      WHERE status = 'active';
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE developers 
      SET status = 'غير نشط' 
      WHERE status = 'inactive';
    `);
  }
};

