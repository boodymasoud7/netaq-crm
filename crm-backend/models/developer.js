const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Developer = sequelize.define('Developer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'اسم المطور'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      },
      comment: 'البريد الإلكتروني'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'رقم الهاتف'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'الموقع'
    },
    specialization: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'التخصص'
    },
    established: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'سنة التأسيس'
    },
    projects_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'عدد المشاريع'
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0.0,
        max: 5.0
      },
      comment: 'التقييم من 5'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      comment: 'حالة المطور'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'وصف المطور'
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'موقع الويب'
    },
    license_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'رقم الترخيص'
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'الموظف المسؤول عن المطور'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'developers',
    timestamps: true,
    paranoid: true, // Enable soft delete
    deletedAt: 'deleted_at'
  });

  // Define associations
  Developer.associate = function(models) {
    // Association for the user who deleted this developer
    Developer.belongsTo(models.User, {
      foreignKey: 'deleted_by',
      as: 'deletedByUser',
      constraints: false
    });
    
    // Association for the user responsible for this developer
    Developer.belongsTo(models.User, {
      foreignKey: 'assigned_to',
      as: 'assignedUser',
      constraints: false
    });
  };

  return Developer;
};
