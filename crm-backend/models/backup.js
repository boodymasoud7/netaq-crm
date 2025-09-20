const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Backup = sequelize.define('Backup', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    googleDriveId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'creating'
    },
    type: {
      type: DataTypes.STRING(20),
      defaultValue: 'manual'
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
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
    tableName: 'backups',
    timestamps: true,
    indexes: [
      {
        fields: ['createdAt']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      }
    ]
  });

  return Backup;
};
