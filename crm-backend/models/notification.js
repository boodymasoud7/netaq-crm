'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      // define association here
      // Notification.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  
  Notification.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of notification (taskAssigned, taskNoteReply, etc.)'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    targetUserEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Email of the user who should receive this notification'
    },
    targetUserName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Name of the user who should receive this notification'
    },
    senderEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Email of the user who triggered this notification'
    },
    senderName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Name of the user who triggered this notification'
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional data related to the notification'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sentViaSSE: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this notification was sent via SSE'
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'Notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['targetUserEmail']
      },
      {
        fields: ['isRead']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Table creation is handled by migrations - no sync needed
  
  return Notification;
};
