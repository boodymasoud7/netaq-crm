'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Lead extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  Lead.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'اسم العميل المحتمل'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'البريد الإلكتروني'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'رقم الهاتف'
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'اسم الشركة'
    },
    interest: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'الاهتمامات'
    },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'الميزانية المتوقعة'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'new',
      comment: 'حالة العميل المحتمل'
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'مصدر العميل المحتمل'
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'medium',
      comment: 'أولوية المتابعة'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'ملاحظات'
    },
    clientType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'نوع العميل'
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'درجة العميل المحتمل'
    },
    assignedTo: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'مسؤول المتابعة'
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'منشئ السجل'
    },
    convertedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'تاريخ التحويل لعميل فعلي'
    },
    convertedTo: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'معرف العميل المحول إليه'
    },
    convertedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'من قام بالتحويل'
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'تاريخ الحذف'
    }
  }, {
    sequelize,
    modelName: 'Lead',
    tableName: 'Leads', // Match migration table name (uppercase)
    paranoid: true, // Enable soft delete
    deletedAt: 'deleted_at', // Custom field name for soft delete
    timestamps: true,
    underscored: false,
    indexes: [
      {
        name: 'idx_leads_status',
        fields: ['status']
      },
      {
        name: 'idx_leads_assigned_to',
        fields: ['assignedTo']
      },
      {
        name: 'idx_leads_source',
        fields: ['source']
      },
      {
        name: 'idx_leads_priority',
        fields: ['priority']
      },
      {
        name: 'idx_leads_created_at',
        fields: ['createdAt']
      }
    ]
  });

  // Define associations
  Lead.associate = function (models) {
    // Association for the user who deleted this lead
    Lead.belongsTo(models.User, {
      foreignKey: 'deleted_by',
      as: 'deletedByUser',
      constraints: false
    });

    // Association for the assigned user
    Lead.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignedToUser',
      constraints: false
    });

    // Association for the user who created this lead
    Lead.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'createdByUser',
      constraints: false
    });
  };


  return Lead;
};