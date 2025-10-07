'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Clients', 'rating', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Client rating from 0 to 5'
    });

    await queryInterface.addColumn('Clients', 'leadScore', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Lead score from 0 to 100'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Clients', 'rating');
    await queryInterface.removeColumn('Clients', 'leadScore');
  }
};
