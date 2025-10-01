'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Helper function to check if column exists
    const columnExists = async (tableName, columnName) => {
      try {
        const tableInfo = await queryInterface.describeTable(tableName);
        return !!tableInfo[columnName];
      } catch (error) {
        return false;
      }
    };

    // Add columns only if they don't exist
    const columnsToAdd = [
      { name: 'unitId', definition: { type: Sequelize.INTEGER, allowNull: true } },
      { name: 'unitNumber', definition: { type: Sequelize.STRING, allowNull: true } },
      { name: 'downPayment', definition: { type: Sequelize.DECIMAL(15, 2), allowNull: true, defaultValue: 0 } },
      { name: 'installments', definition: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 } },
      { name: 'commissionRate', definition: { type: Sequelize.DECIMAL(5, 2), allowNull: true, defaultValue: 0 } },
      { name: 'totalAmount', definition: { type: Sequelize.DECIMAL(15, 2), allowNull: true, defaultValue: 0 } },
      { name: 'paymentStatus', definition: { type: Sequelize.STRING, allowNull: true, defaultValue: 'pending' } },
      { name: 'notes', definition: { type: Sequelize.TEXT, allowNull: true } }
    ];

    for (const column of columnsToAdd) {
      const exists = await columnExists('Sales', column.name);
      if (!exists) {
        console.log(`Adding column ${column.name} to Sales table`);
        await queryInterface.addColumn('Sales', column.name, column.definition);
      } else {
        console.log(`Column ${column.name} already exists in Sales table`);
      }
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Sales', 'unitId');
    await queryInterface.removeColumn('Sales', 'unitNumber');
    await queryInterface.removeColumn('Sales', 'downPayment');
    await queryInterface.removeColumn('Sales', 'installments');
    await queryInterface.removeColumn('Sales', 'commissionRate');
    await queryInterface.removeColumn('Sales', 'totalAmount');
    await queryInterface.removeColumn('Sales', 'paymentStatus');
    await queryInterface.removeColumn('Sales', 'notes');
  }
};
