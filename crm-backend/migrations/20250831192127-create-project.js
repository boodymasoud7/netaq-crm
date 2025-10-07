'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Projects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      location: {
        type: Sequelize.STRING
      },
      developer: {
        type: Sequelize.STRING
      },
      totalUnits: {
        type: Sequelize.INTEGER
      },
      availableUnits: {
        type: Sequelize.INTEGER
      },
      priceRange: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      completion: {
        type: Sequelize.INTEGER
      },
      amenities: {
        type: Sequelize.JSON
      },
      description: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('Projects');
  }
};