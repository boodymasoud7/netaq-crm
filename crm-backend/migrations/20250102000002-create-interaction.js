'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Interactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      itemType: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type of item (client, lead, project, etc.)'
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of the related item'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type of interaction (call, email, meeting, whatsapp, visit, etc.)'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Title of the interaction'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of the interaction'
      },
      outcome: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'neutral',
        comment: 'Outcome of the interaction (positive, negative, neutral)'
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Duration in minutes'
      },
      nextAction: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Next action to be taken'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes'
      },
      createdBy: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'ID of user who created the interaction'
      },
      createdByName: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Name of user who created the interaction'
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

    // Add indexes for better performance
    await queryInterface.addIndex('Interactions', ['itemType', 'itemId']);
    await queryInterface.addIndex('Interactions', ['createdBy']);
    await queryInterface.addIndex('Interactions', ['type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Interactions');
  }
};








