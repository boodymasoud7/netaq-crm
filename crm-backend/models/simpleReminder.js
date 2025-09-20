'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SimpleReminder extends Model {
    static associate(models) {
      // Associate with User model
      SimpleReminder.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }

    // Helper method to check if reminder is due
    isDue() {
      return this.remind_at <= new Date() && this.status === 'pending';
    }

    // Helper method to mark as done
    async markAsDone() {
      this.status = 'done';
      await this.save();
      return this;
    }
  }

  SimpleReminder.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Note cannot be empty'
        },
        len: {
          args: [1, 1000],
          msg: 'Note must be between 1 and 1000 characters'
        }
      }
    },
    remind_at: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'remind_at must be a valid date'
        },
        isFuture(value) {
          if (new Date(value) <= new Date()) {
            throw new Error('Reminder time must be in the future');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'done'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'done']],
          msg: 'Status must be either pending or done'
        }
      }
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Clients',
        key: 'id'
      }
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Leads', 
        key: 'id'
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'general'
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'medium'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'SimpleReminder',
    tableName: 'simple_reminders',
    timestamps: true,
    paranoid: true, // Enable soft delete
    deletedAt: 'deleted_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['remind_at']
      },
      {
        fields: ['status']
      },
      {
        fields: ['remind_at', 'status']
      }
    ]
  });

  return SimpleReminder;
};





