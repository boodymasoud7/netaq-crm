'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // إضافة columns جديدة لجدول simple_reminders
    await queryInterface.addColumn('simple_reminders', 'client_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id'
      }
    });

    await queryInterface.addColumn('simple_reminders', 'lead_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'leads',
        key: 'id'
      }
    });

    await queryInterface.addColumn('simple_reminders', 'type', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'general'
    });

    await queryInterface.addColumn('simple_reminders', 'priority', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'medium'
    });

    await queryInterface.addColumn('simple_reminders', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // إضافة indexes للأداء
    await queryInterface.addIndex('simple_reminders', ['client_id'], {
      name: 'idx_simple_reminders_client_id'
    });

    await queryInterface.addIndex('simple_reminders', ['lead_id'], {
      name: 'idx_simple_reminders_lead_id'
    });

    await queryInterface.addIndex('simple_reminders', ['type'], {
      name: 'idx_simple_reminders_type'
    });
  },

  async down (queryInterface, Sequelize) {
    // حذف indexes
    await queryInterface.removeIndex('simple_reminders', 'idx_simple_reminders_client_id');
    await queryInterface.removeIndex('simple_reminders', 'idx_simple_reminders_lead_id');
    await queryInterface.removeIndex('simple_reminders', 'idx_simple_reminders_type');

    // حذف columns
    await queryInterface.removeColumn('simple_reminders', 'client_id');
    await queryInterface.removeColumn('simple_reminders', 'lead_id');
    await queryInterface.removeColumn('simple_reminders', 'type');
    await queryInterface.removeColumn('simple_reminders', 'priority');
    await queryInterface.removeColumn('simple_reminders', 'description');
  }
};
