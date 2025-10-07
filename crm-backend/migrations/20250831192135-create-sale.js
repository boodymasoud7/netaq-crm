'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sales', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      clientName: {
        type: Sequelize.STRING
      },
      clientId: {
        type: Sequelize.INTEGER
      },
      projectName: {
        type: Sequelize.STRING
      },
      projectId: {
        type: Sequelize.INTEGER
      },
      unitType: {
        type: Sequelize.STRING
      },
      price: {
        type: Sequelize.DECIMAL
      },
      commission: {
        type: Sequelize.DECIMAL
      },
      status: {
        type: Sequelize.STRING
      },
      saleDate: {
        type: Sequelize.DATE
      },
      salesPerson: {
        type: Sequelize.STRING
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Sales');
  }
};