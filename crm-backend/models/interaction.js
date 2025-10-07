'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Interaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Interaction.init({
    itemType: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of item (client, lead, project, etc.)'
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID of the related item'
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of interaction (call, meeting, email, etc.)'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Title of the interaction'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the interaction'
    },
    outcome: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Outcome of the interaction'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in minutes'
    },
    nextAction: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Next action to take'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes'
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'ID of user who created the interaction'
    },
    createdByName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Name of user who created the interaction'
    }
  }, {
    sequelize,
    modelName: 'Interaction',
    tableName: 'Interactions',
    timestamps: true
  });
  return Interaction;
};