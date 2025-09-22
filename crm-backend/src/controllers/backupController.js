const backupService = require('../services/backupService');
const LocalBackupService = require('../services/localBackupService');
const { Backup } = require('../../models');

class BackupController {
  // Create a new backup
  async createBackup(req, res) {
    let backupRecord = null;
    
    try {
      const { type = 'manual' } = req.body;
      const createdBy = req.user?.email || req.user?.id || 'system';

      // Create backup record with unique googleDriveId
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      backupRecord = await Backup.create({
        filename: `backup_${timestamp}.dump.gz`,
        googleDriveId: `pending_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        size: 0,
        status: 'creating',
        type,
        createdBy
      });

      console.log(`🚀 Starting backup creation: ${backupRecord.filename}`);

      // Create backup synchronously to avoid issues with server restart
      const localBackupService = new LocalBackupService();
      const result = await localBackupService.createAndStoreBackup();

      // Update backup record with results
      await backupRecord.update({
        googleDriveId: result.backup.id,
        size: result.backup.size,
        status: 'completed',
        filename: result.backup.name,
        metadata: {
          storageType: 'local',
          createdAt: result.backup.createdTime,
          originalSize: result.backup.size,
          completedAt: new Date().toISOString()
        }
      });

      console.log(`✅ Backup created successfully: ${result.backup.name}`);

      res.json({
        success: true,
        message: 'Backup created successfully',
        backup: {
          id: backupRecord.id,
          filename: result.backup.name,
          size: result.backup.size,
          status: 'completed',
          type: backupRecord.type,
          createdAt: backupRecord.createdAt
        }
      });
    } catch (error) {
      console.error('Create backup error:', error);
      
      // Update backup record as failed if it was created
      if (backupRecord) {
        try {
          await backupRecord.update({
            status: 'failed',
            metadata: {
              error: error.message,
              failedAt: new Date().toISOString()
            }
          });
        } catch (updateError) {
          console.error('Error updating failed backup record:', updateError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create backup',
        error: error.message
      });
    }
  }

  // List all backups
  async listBackups(req, res) {
    try {
      const { page = 1, limit = 100, status, type } = req.query;
      
      const where = {};
      if (status) where.status = status;
      if (type) where.type = type;

      const backups = await Backup.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      // Get local backups for comparison
      const localBackupService = new LocalBackupService();
      const driveBackups = await localBackupService.listLocalBackups();

      res.json({
        success: true,
        data: backups.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: backups.count,
          pages: Math.ceil(backups.count / parseInt(limit))
        },
        driveBackups
      });
    } catch (error) {
      console.error('List backups error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list backups',
        error: error.message
      });
    }
  }

  // Download a backup
  async downloadBackup(req, res) {
    try {
      const { id } = req.params;
      
      const backup = await Backup.findByPk(id);
      if (!backup) {
        return res.status(404).json({
          success: false,
          message: 'Backup not found'
        });
      }

      if (backup.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Backup is not ready for download'
        });
      }

      const localBackupService = new LocalBackupService();
      const downloadInfo = await localBackupService.downloadBackup(backup.filename);

      console.log(`📥 Starting download for backup: ${backup.filename}`);
      console.log(`📁 File path: ${downloadInfo.path}`);
      console.log(`💾 File size: ${downloadInfo.size} bytes`);

      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Length', downloadInfo.size);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Stream the file to the client
      downloadInfo.stream.pipe(res);
      
      downloadInfo.stream.on('error', (streamError) => {
        console.error('❌ Stream error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming backup file'
          });
        }
      });

      downloadInfo.stream.on('end', () => {
        console.log(`✅ Download completed: ${backup.filename}`);
      });
      
    } catch (error) {
      console.error('Download backup error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to download backup',
          error: error.message
        });
      }
    }
  }

  // Restore a backup
  async restoreBackup(req, res) {
    try {
      console.log('🔄 Starting backup restore process...');
      const { id } = req.params;
      console.log(`📝 Backup ID: ${id}`);
      
      const backup = await Backup.findByPk(id);
      if (!backup) {
        console.error(`❌ Backup not found with ID: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Backup not found'
        });
      }

      console.log(`📋 Found backup: ${backup.filename}, status: ${backup.status}`);

      if (backup.status !== 'completed') {
        console.error(`❌ Backup not ready for restore. Status: ${backup.status}`);
        return res.status(400).json({
          success: false,
          message: 'Backup is not ready for restore'
        });
      }

      // Restore database from local backup
      console.log('🚀 Initializing LocalBackupService...');
      const LocalBackupService = require('../services/localBackupService');
      const localBackupService = new LocalBackupService();
      
      console.log(`📥 Starting restore of backup: ${backup.filename}`);
      const restoreResult = await localBackupService.restoreBackup(backup.filename);
      
      // Update backup record to mark it was used for restore
      await backup.update({
        metadata: {
          ...backup.metadata,
          lastRestoreDate: new Date().toISOString(),
          restoreCount: (backup.metadata?.restoreCount || 0) + 1
        }
      });

      console.log(`✅ Backup restored successfully: ${backup.filename}`);

      res.json({
        success: true,
        message: 'Database restored successfully.',
        restore: restoreResult
      });

      // Skip auto-restart for testing
      console.log('ℹ️ Auto-restart disabled for testing. You may need to manually restart the server after restore.');
      
      /* Auto-restart server after sending response
      setTimeout(() => {
        console.log('🔄 Auto-restarting server after database restore...');
        
        // Check if running with nodemon
        const isNodemon = process.env.npm_lifecycle_event === 'dev' || 
                         process.argv[1]?.includes('nodemon') ||
                         process.env.NODE_ENV === 'development';
        
        if (isNodemon) {
          console.log('📝 Detected nodemon - triggering file change for auto-restart...');
          
          // Create a temporary file to trigger nodemon restart
          const fs = require('fs');
          const path = require('path');
          const triggerFile = path.join(process.cwd(), '.restart-trigger');
          
          // Write and immediately delete to trigger nodemon
          fs.writeFileSync(triggerFile, new Date().toISOString());
          setTimeout(() => {
            if (fs.existsSync(triggerFile)) {
              fs.unlinkSync(triggerFile);
            }
          }, 100);
          
          // Also exit to ensure restart
          setTimeout(() => process.exit(0), 500);
        } else {
          // Production mode - spawn new process
          console.log('🚀 Production mode - spawning new server process...');
          
          const args = process.argv.slice(1);
          const { spawn } = require('child_process');
          
          const child = spawn(process.argv[0], args, {
            detached: true,
            stdio: 'inherit',
            cwd: process.cwd(),
            env: process.env
          });
          
          child.unref();
          console.log('✅ New server process started, terminating current process...');
          process.exit(0);
        }
      }, 2000);
      */
    } catch (error) {
      console.error('❌ Restore backup error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to restore backup',
        error: error.message,
        details: error.stack
      });
    }
  }

  // Delete a backup
  async deleteBackup(req, res) {
    try {
      const { id } = req.params;
      
      const backup = await Backup.findByPk(id);
      if (!backup) {
        return res.status(404).json({
          success: false,
          message: 'Backup not found'
        });
      }

      // Delete file first
      if (backup.filename) {
        try {
          const localBackupService = new LocalBackupService();
          await localBackupService.deleteBackup(backup.filename);
          console.log(`🗑️ Deleted backup file: ${backup.filename}`);
        } catch (fileError) {
          console.warn(`Warning: Failed to delete backup file ${backup.filename}:`, fileError.message);
        }
      }

      // Delete database record
      await backup.destroy();
      console.log(`🗑️ Deleted backup record: ${backup.id}`);

      res.json({
        success: true,
        message: 'Backup deleted successfully'
      });
    } catch (error) {
      console.error('Delete backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete backup',
        error: error.message
      });
    }
  }

  // Get storage information
  async getStorageInfo(req, res) {
    try {
      const localBackupService = new LocalBackupService();
      const storageInfo = await localBackupService.getStorageInfo();
      const backupCount = await Backup.count();

      res.json({
        success: true,
        data: {
          ...storageInfo,
          databaseBackups: backupCount
        }
      });
    } catch (error) {
      console.error('Get storage info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get storage information',
        error: error.message
      });
    }
  }

  // Upload a backup file from user's device
  async clearAllBackups(req, res) {
    try {
      console.log('🧹 بدء حذف جميع النسخ الاحتياطية...');
      
      const { Backup } = require('../models');
      const fs = require('fs-extra');
      const path = require('path');
      
      // Count existing backups
      const totalBackups = await Backup.count({ paranoid: false });
      console.log(`📊 وجدت ${totalBackups} نسخة في قاعدة البيانات`);
      
      // Get all backups from database
      const allBackups = await Backup.findAll({ paranoid: false });
      
      // Delete all database records
      await Backup.destroy({ where: {}, force: true });
      console.log('🗑️ تم حذف جميع السجلات من قاعدة البيانات');
      
      // Reset sequence if possible
      try {
        await Backup.sequelize.query('DELETE FROM sqlite_sequence WHERE name="Backups"');
        console.log('🔄 تم إعادة تعيين معرف التسلسل');
      } catch (seqError) {
        console.warn('⚠️ تحذير: لم يتم إعادة تعيين التسلسل');
      }
      
      // Delete backup files
      const localBackupService = new LocalBackupService();
      const backupDir = localBackupService.backupDir;
      let deletedFiles = 0;
      
      if (await fs.pathExists(backupDir)) {
        const files = await fs.readdir(backupDir);
        const backupFiles = files.filter(file => 
          file.endsWith('.gz') || 
          file.endsWith('.json') || 
          file.includes('backup') || 
          file.includes('uploaded')
        );
        
        console.log(`📁 وجدت ${backupFiles.length} ملف نسخ احتياطية`);
        
        for (const file of backupFiles) {
          try {
            const filePath = path.join(backupDir, file);
            await fs.remove(filePath);
            deletedFiles++;
            console.log(`✅ تم حذف: ${file}`);
          } catch (error) {
            console.error(`❌ فشل حذف ${file}:`, error.message);
          }
        }
      }
      
      // Recreate clean backup directory
      await fs.ensureDir(backupDir);
      console.log('📁 تم إنشاء مجلد نظيف للنسخ الاحتياطية');
      
      // Final verification
      const remainingBackups = await Backup.count({ paranoid: false });
      const remainingFiles = await fs.pathExists(backupDir) ? 
        (await fs.readdir(backupDir)).filter(file => 
          file.endsWith('.gz') || file.endsWith('.json')
        ).length : 0;
      
      console.log(`📊 النسخ المتبقية في قاعدة البيانات: ${remainingBackups}`);
      console.log(`📁 الملفات المتبقية: ${remainingFiles}`);
      console.log('✅ تم التنظيف الشامل بنجاح!');
      
      res.json({
        success: true,
        message: 'تم مسح جميع النسخ الاحتياطية بنجاح',
        deleted: {
          records: totalBackups,
          files: deletedFiles
        },
        remaining: {
          records: remainingBackups,
          files: remainingFiles
        }
      });

    } catch (error) {
      console.error('❌ خطأ في مسح النسخ الاحتياطية:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في مسح النسخ الاحتياطية',
        error: error.message
      });
    }
  }

  async uploadBackup(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'لم يتم العثور على ملف النسخة الاحتياطية'
        });
      }

      const file = req.file;
      const createdBy = req.user?.email || req.user?.id || 'user';
      
      console.log(`📤 بدء رفع النسخة الاحتياطية: ${file.originalname}`);
      console.log(`📊 حجم الملف: ${file.size} بايت`);

      // Validate file extension
      const allowedExtensions = ['.gz', '.json'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          message: 'صيغة الملف غير مدعومة. يجب أن يكون .gz أو .json'
        });
      }

      // Generate unique filename to avoid conflicts
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const uniqueFilename = `uploaded_${timestamp}_${file.originalname}`;
      
      // Move file to backups directory
      const localBackupService = new LocalBackupService();
      const fs = require('fs-extra');
      const path = require('path');
      const backupPath = path.join(localBackupService.backupDir, uniqueFilename);
      
      await fs.move(file.path, backupPath);
      
      // Get file stats
      const stats = await fs.stat(backupPath);
      
      // Create backup record in database
      const backupRecord = await Backup.create({
        filename: uniqueFilename,
        googleDriveId: `uploaded_${uniqueFilename}`,
        size: stats.size,
        status: 'completed',
        type: 'manual',
        createdBy: createdBy,
        metadata: {
          storageType: 'local',
          uploadedFile: true,
          originalFilename: file.originalname,
          uploadedAt: new Date().toISOString(),
          uploadedBy: createdBy
        }
      });

      console.log(`✅ تم رفع النسخة الاحتياطية بنجاح: ${uniqueFilename}`);

      res.json({
        success: true,
        message: 'تم رفع النسخة الاحتياطية بنجاح',
        backup: {
          id: backupRecord.id,
          filename: uniqueFilename,
          originalFilename: file.originalname,
          size: stats.size,
          status: 'completed',
          type: 'manual',
          uploadedAt: backupRecord.createdAt
        }
      });

    } catch (error) {
      console.error('❌ خطأ في رفع النسخة الاحتياطية:', error);
      
      // Clean up uploaded file if error occurred
      if (req.file && req.file.path) {
        try {
          await require('fs-extra').remove(req.file.path);
        } catch (cleanupError) {
          console.error('خطأ في تنظيف الملف:', cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'فشل في رفع النسخة الاحتياطية',
        error: error.message
      });
    }
  }

  // Get backup statistics
  async getBackupStats(req, res) {
    try {
      const totalBackups = await Backup.count();
      const completedBackups = await Backup.count({ where: { status: 'completed' } });
      const failedBackups = await Backup.count({ where: { status: 'failed' } });
      const totalSize = await Backup.sum('size') || 0;

      const localBackupService = new LocalBackupService();
      const storageInfo = await localBackupService.getStorageInfo();

      res.json({
        success: true,
        stats: {
          totalBackups,
          completedBackups,
          failedBackups,
          totalSize,
          storageInfo
        }
      });
    } catch (error) {
      console.error('Get backup stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get backup statistics',
        error: error.message
      });
    }
  }

  // Clear all backups (for development/testing)
  async clearAllBackups(req, res) {
    try {
      console.log('🧹 تنظيف جميع النسخ الاحتياطية...');
      
      // Get all backups first
      const allBackups = await Backup.findAll();
      console.log(`📊 وجدت ${allBackups.length} نسخة احتياطية`);

      // Delete local files
      const localBackupService = new LocalBackupService();
      let deletedFiles = 0;
      
      for (const backup of allBackups) {
        try {
          await localBackupService.deleteBackup(backup.filename);
          deletedFiles++;
        } catch (error) {
          console.warn(`تحذير: لم يتم حذف الملف ${backup.filename}:`, error.message);
        }
      }

      // Clear database records
      const deletedCount = await Backup.destroy({ where: {} });
      
      // Reset sequence (if using PostgreSQL)
      try {
        await Backup.sequelize.query('ALTER SEQUENCE backups_id_seq RESTART WITH 1');
      } catch (seqError) {
        console.warn('تحذير: لم يتم إعادة تعيين التسلسل:', seqError.message);
      }

      console.log(`✅ تم حذف ${deletedCount} سجل و ${deletedFiles} ملف`);

      res.json({
        success: true,
        message: `تم حذف جميع النسخ الاحتياطية بنجاح`,
        deleted: {
          records: deletedCount,
          files: deletedFiles
        }
      });
    } catch (error) {
      console.error('Clear all backups error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear backups',
        error: error.message
      });
    }
  }

  // Test Google Drive connection (placeholder)
  async testGoogleDrive(req, res) {
    try {
      res.json({
        success: true,
        message: 'Google Drive connection test not implemented yet',
        connected: false
      });
    } catch (error) {
      console.error('Test Google Drive error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test Google Drive connection',
        error: error.message
      });
    }
  }

  // Rotate old backups
  async rotateBackups(req, res) {
    try {
      const { keepCount = 7 } = req.body;
      
      console.log(`🔄 بدء دورة تنظيف النسخ القديمة (الاحتفاظ بـ ${keepCount} نسخ)...`);
      
      // Get all backups ordered by creation date
      const allBackups = await Backup.findAll({
        order: [['createdAt', 'DESC']],
        where: { status: 'completed' }
      });
      
      if (allBackups.length <= keepCount) {
        return res.json({
          success: true,
          message: `لا حاجة للتنظيف. عدد النسخ الحالي: ${allBackups.length}`,
          deleted: 0
        });
      }
      
      // Get backups to delete (keep the most recent ones)
      const backupsToDelete = allBackups.slice(keepCount);
      
      let deletedCount = 0;
      const localBackupService = new LocalBackupService();
      
      for (const backup of backupsToDelete) {
        try {
          // Delete file first
          await localBackupService.deleteBackup(backup.filename);
          
          // Delete database record
          await backup.destroy();
          
          deletedCount++;
          console.log(`🗑️ تم حذف النسخة: ${backup.filename}`);
        } catch (error) {
          console.error(`خطأ في حذف النسخة ${backup.filename}:`, error);
        }
      }
      
      console.log(`✅ تم حذف ${deletedCount} نسخة قديمة`);
      
      res.json({
        success: true,
        message: `تم حذف ${deletedCount} نسخة قديمة بنجاح`,
        deleted: deletedCount,
        remaining: allBackups.length - deletedCount
      });
      
    } catch (error) {
      console.error('Rotate backups error:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في تنظيف النسخ القديمة',
        error: error.message
      });
    }
  }
}

module.exports = new BackupController();