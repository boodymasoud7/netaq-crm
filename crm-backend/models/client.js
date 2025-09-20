'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Association for the user who deleted this client
      if (models.User) {
        Client.belongsTo(models.User, {
          foreignKey: 'deleted_by',
          as: 'deletedByUser',
          constraints: false
        });
      }
    }
  }
  Client.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.TEXT,
    budget: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    source: DataTypes.STRING,
    notes: DataTypes.TEXT,
    assignedTo: DataTypes.STRING,
    lastContact: DataTypes.DATE,
    deleted_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Client',
    paranoid: true, // Enable soft delete
    deletedAt: 'deleted_at' // Custom field name for soft delete
  });

  return Client;
};