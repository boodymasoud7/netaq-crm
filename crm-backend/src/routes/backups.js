const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authMiddleware, requirePermission } = require('../middleware/simple-auth');
const { uploadBackup } = require('../middleware/upload');

// Apply authentication to all backup routes
router.use(authMiddleware);

// Create a new backup (Admin only)
router.post('/create', 
  requirePermission('manage_backups'), 
  backupController.createBackup
);

// List all backups (Admin only)
router.get('/list', 
  requirePermission('view_backups'), 
  backupController.listBackups
);

// Download a backup (Admin only)
router.get('/download/:id', 
  requirePermission('download_backups'), 
  backupController.downloadBackup
);

// Restore a backup (Admin only)
router.post('/restore/:id', 
  requirePermission('restore_backups'), 
  backupController.restoreBackup
);

// Delete a backup (Admin only)
router.delete('/delete/:id', 
  requirePermission('delete_backups'), 
  backupController.deleteBackup
);

// Get storage information (Admin only)
router.get('/storage', 
  requirePermission('view_backups'), 
  backupController.getStorageInfo
);

// Test Google Drive connection (Admin only)
router.get('/test-google-drive', 
  requirePermission('manage_backups'), 
  backupController.testGoogleDrive
);

// Manual backup rotation (Admin only)
router.post('/rotate', 
  requirePermission('manage_backups'), 
  backupController.rotateBackups
);

// Get backup statistics (Admin only)
router.get('/stats', 
  requirePermission('view_backups'), 
  backupController.getBackupStats
);

// Upload backup file from local device (Admin only)
router.post('/upload', 
  requirePermission('manage_backups'), 
  (req, res, next) => {
    uploadBackup(req, res, (err) => {
      if (err) {
        console.error('Multer upload error:', err);
        return res.status(400).json({
          success: false,
          message: 'خطأ في رفع الملف',
          error: err.message
        });
      }
      next();
    });
  },
  backupController.uploadBackup
);

// Clear all backups (Admin only - for development/testing)
router.delete('/clear-all', 
  requirePermission('manage_backups'), 
  backupController.clearAllBackups
);

module.exports = router;