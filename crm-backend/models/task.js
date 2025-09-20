'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Task.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    assignedTo: DataTypes.STRING,
    dueDate: DataTypes.DATE,
    priority: DataTypes.STRING,
    status: DataTypes.STRING,
    category: DataTypes.STRING,
    progress: DataTypes.INTEGER,
    tags: DataTypes.JSON,
    leadName: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Task',
    timestamps: true,
    paranoid: true, // Enable soft delete
    deletedAt: 'deleted_at'
  });
  // Define associations
  Task.associate = function(models) {
    // Association for the user who deleted this task
    Task.belongsTo(models.User, {
      foreignKey: 'deleted_by',
      as: 'deletedByUser',
      constraints: false
    });
  };

  return Task;
};