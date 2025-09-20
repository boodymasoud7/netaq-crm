'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('Notifications'));
    
    if (tableExists) {
      console.log('Notifications table already exists, skipping creation');
      return;
    }

    console.log('Creating Notifications table...');
    await queryInterface.createTable('Notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type of notification (taskAssigned, taskNoteReply, etc.)'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      targetUserEmail: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Email of the user who should receive this notification'
      },
      targetUserName: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Name of the user who should receive this notification'
      },
      senderEmail: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Email of the user who triggered this notification'
      },
      senderName: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Name of the user who triggered this notification'
      },
      data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional data related to the notification'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sentViaSSE: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this notification was sent via SSE'
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    console.log('Creating indexes for Notifications table...');
    // Add indexes for better query performance
    await queryInterface.addIndex('Notifications', ['targetUserEmail']);
    await queryInterface.addIndex('Notifications', ['isRead']);
    await queryInterface.addIndex('Notifications', ['type']);
    await queryInterface.addIndex('Notifications', ['createdAt']);
    
    console.log('✅ Notifications table and indexes created successfully');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Notifications');
  }
};