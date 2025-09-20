'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Note extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // A note can belong to different items (polymorphic)
      // Note.belongsTo(models.Client, { foreignKey: 'itemId', constraints: false });
      // Note.belongsTo(models.Lead, { foreignKey: 'itemId', constraints: false });
    }
  }
  Note.init({
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
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
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'ID of user who created the note'
    },
    createdByName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Name of user who created the note'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Optional title for the note'
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'general',
      comment: 'Type of note (general, important, reminder, etc.)'
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'medium',
      comment: 'Priority level (low, medium, high)'
    },
    managerComment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Manager comment on the note'
    },
    managerCommentBy: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Name of manager who added comment'
    },
    managerCommentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when manager comment was added'
    }
  }, {
    sequelize,
    modelName: 'Note',
    tableName: 'Notes',
    timestamps: true
  });
  return Note;
};