'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('backups', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      googleDriveId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      size: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('creating', 'uploading', 'completed', 'failed'),
        defaultValue: 'creating'
      },
      type: {
        type: Sequelize.ENUM('manual', 'automatic'),
        defaultValue: 'manual'
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('backups', ['createdAt']);
    await queryInterface.addIndex('backups', ['status']);
    await queryInterface.addIndex('backups', ['type']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('backups');
  }
};
