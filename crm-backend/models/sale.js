'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Sale.init({
    clientName: DataTypes.STRING,
    clientId: DataTypes.INTEGER,
    projectName: DataTypes.STRING,
    projectId: DataTypes.INTEGER,
    unitType: DataTypes.STRING,
    unitId: DataTypes.INTEGER,
    unitNumber: DataTypes.STRING,
    price: DataTypes.DECIMAL,
    downPayment: DataTypes.DECIMAL,
    installments: DataTypes.INTEGER,
    commission: DataTypes.DECIMAL,
    commissionRate: DataTypes.DECIMAL,
    totalAmount: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    paymentStatus: DataTypes.STRING,
    saleDate: DataTypes.DATE,
    salesPerson: DataTypes.STRING,
    notes: DataTypes.TEXT,
    deleted_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Sale',
    paranoid: true, // Enable soft delete
    deletedAt: 'deleted_at' // Custom field name for soft delete
  });
  return Sale;
};