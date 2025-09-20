'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Update the ENUM type to include 'notified' status
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_simple_reminders_status" ADD VALUE IF NOT EXISTS 'notified';
    `);
    
    console.log('✅ Updated simple_reminders status enum to include notified');
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't allow removing ENUM values easily
    // This would require recreating the type which could be complex
    console.log('✅ Down migration - ENUM update cannot be easily reversed in PostgreSQL');
  }
};







