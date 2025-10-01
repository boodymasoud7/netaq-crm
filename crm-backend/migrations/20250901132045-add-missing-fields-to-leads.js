'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Leads', 'company', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('Leads', 'clientType', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'فردي'
    });
    
    await queryInterface.addColumn('Leads', 'score', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Leads', 'createdBy', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Leads', 'company');
    await queryInterface.removeColumn('Leads', 'clientType');
    await queryInterface.removeColumn('Leads', 'score');
    await queryInterface.removeColumn('Leads', 'createdBy');
  }
};
