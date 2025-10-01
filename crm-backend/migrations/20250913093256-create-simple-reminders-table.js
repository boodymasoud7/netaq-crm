'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('simple_reminders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      remind_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'done'),
        allowNull: false,
        defaultValue: 'pending'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add index for efficient querying
    await queryInterface.addIndex('simple_reminders', ['user_id']);
    await queryInterface.addIndex('simple_reminders', ['remind_at']);
    await queryInterface.addIndex('simple_reminders', ['status']);
    await queryInterface.addIndex('simple_reminders', ['remind_at', 'status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('simple_reminders');
  }
};