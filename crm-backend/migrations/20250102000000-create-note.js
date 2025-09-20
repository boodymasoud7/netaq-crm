'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Notes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
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
      createdBy: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'ID of user who created the note'
      },
      createdByName: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Name of user who created the note'
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
    
    // Add index for better performance
    await queryInterface.addIndex('Notes', ['itemType', 'itemId']);
    await queryInterface.addIndex('Notes', ['createdBy']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Notes');
  }
};








