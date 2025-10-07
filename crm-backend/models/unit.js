const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Unit = sequelize.define('Unit', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'اسم الوحدة'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'معرف المشروع'
    },
    projectName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'اسم المشروع'
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'نوع الوحدة'
    },
    area: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'المساحة بالمتر المربع'
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'عدد غرف النوم'
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'عدد الحمامات'
    },
    floor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'رقم الطابق'
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'السعر'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'available',
      comment: 'حالة الوحدة'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'وصف الوحدة'
    },
    amenities: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'المرافق والخدمات'
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'صور الوحدة'
    },
    // Soft delete support
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'units',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      {
        fields: ['projectId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['price']
      },
      {
        fields: ['area']
      }
    ]
  });

  return Unit;
};
