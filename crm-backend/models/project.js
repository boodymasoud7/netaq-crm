'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Project.init({
    name: DataTypes.STRING,
    location: DataTypes.STRING,
    developer: DataTypes.STRING,
    totalUnits: DataTypes.INTEGER,
    availableUnits: DataTypes.INTEGER,
    priceRange: DataTypes.STRING,
    status: DataTypes.STRING,
    completion: DataTypes.INTEGER,
    amenities: DataTypes.JSON,
    description: DataTypes.TEXT,
    deleted_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Project',
    paranoid: true, // Enable soft delete
    deletedAt: 'deleted_at' // Custom field name for soft delete
  });
  return Project;
};