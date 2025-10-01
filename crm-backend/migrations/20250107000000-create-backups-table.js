'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('backups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'اسم ملف النسخة الاحتياطية'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'وصف النسخة الاحتياطية'
      },
      type: {
        type: Sequelize.STRING(20),
        defaultValue: 'manual',
        comment: 'نوع النسخة الاحتياطية'
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'creating',
        comment: 'حالة النسخة الاحتياطية'
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'مسار الملف'
      },
      size: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'حجم الملف بالبايت'
      },
      checksum: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'المجموع التحققي للملف'
      },
      compression: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'هل تم ضغط الملف'
      },
      encryption: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'هل تم تشفير الملف'
      },
      includes: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'المحتويات المتضمنة في النسخة'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'وقت بدء العملية'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'وقت انتهاء العملية'
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'مدة العملية بالثواني'
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'نسبة التقدم'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'رسالة الخطأ في حالة الفشل'
      },
      createdBy: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'المستخدم الذي أنشأ النسخة'
      },
      googleDriveId: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'معرف الملف في Google Drive'
      },
      google_drive_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'رابط الملف في Google Drive'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'بيانات إضافية'
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('backups', ['status']);
    await queryInterface.addIndex('backups', ['type']);
    await queryInterface.addIndex('backups', ['createdBy']);
    await queryInterface.addIndex('backups', ['createdAt']);
    await queryInterface.addIndex('backups', ['completed_at']);

    // Add foreign key constraint for createdBy (commented out as it's now a string)
    // await queryInterface.addConstraint('backups', {
    //   fields: ['createdBy'],
    //   type: 'foreign key',
    //   name: 'fk_backups_created_by',
    //   references: {
    //     table: 'Users',
    //     field: 'id'
    //   },
    //   onDelete: 'SET NULL',
    //   onUpdate: 'CASCADE'
    // });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraint (commented out)
    // await queryInterface.removeConstraint('backups', 'fk_backups_created_by');
    
    // Drop table
    await queryInterface.dropTable('backups');
  }
};
