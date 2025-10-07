const express = require('express');
const router = express.Router();
const { cleanupOldNotifications, CLEANUP_CONFIG } = require('../cron/cleanupNotifications');
const { authMiddleware, requirePermission } = require('../middleware/simple-auth');

// Apply authentication to all routes
router.use(authMiddleware);

// تنظيف يدوي للإشعارات (Admin only)
router.post('/cleanup', 
  requirePermission('manage_notifications'), 
  async (req, res) => {
    try {
      console.log('🧹 Manual notification cleanup triggered by:', req.user.email);
      
      const result = await cleanupOldNotifications();
      
      res.json({
        success: true,
        message: 'تم تنظيف الإشعارات بنجاح',
        data: {
          deletedOld: result.deletedOld,
          deletedRead: result.deletedRead,
          remainingCount: result.remainingCount,
          config: {
            retentionDays: CLEANUP_CONFIG.retentionDays,
            readRetentionDays: CLEANUP_CONFIG.readRetentionDays,
            maxNotifications: CLEANUP_CONFIG.maxNotifications
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Error in manual cleanup:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في تنظيف الإشعارات',
        error: error.message
      });
    }
  }
);

// الحصول على إحصائيات الإشعارات (Admin only)
router.get('/stats', 
  requirePermission('view_notifications'), 
  async (req, res) => {
    try {
      const { Notification } = require('../../models');
      const { Op } = require('sequelize');
      
      const now = new Date();
      const retentionDate = new Date(now - CLEANUP_CONFIG.retentionDays * 24 * 60 * 60 * 1000);
      const readRetentionDate = new Date(now - CLEANUP_CONFIG.readRetentionDays * 24 * 60 * 60 * 1000);
      
      const totalCount = await Notification.count();
      const unreadCount = await Notification.count({ where: { isRead: false } });
      const readCount = await Notification.count({ where: { isRead: true } });
      
      const oldCount = await Notification.count({
        where: {
          createdAt: {
            [Op.lt]: retentionDate
          }
        }
      });
      
      const oldReadCount = await Notification.count({
        where: {
          isRead: true,
          createdAt: {
            [Op.lt]: readRetentionDate
          }
        }
      });
      
      res.json({
        success: true,
        data: {
          total: totalCount,
          unread: unreadCount,
          read: readCount,
          canBeDeleted: {
            old: oldCount,
            oldRead: oldReadCount,
            total: oldCount + oldReadCount
          },
          config: {
            retentionDays: CLEANUP_CONFIG.retentionDays,
            readRetentionDays: CLEANUP_CONFIG.readRetentionDays,
            maxNotifications: CLEANUP_CONFIG.maxNotifications,
            cronPattern: CLEANUP_CONFIG.cronPattern
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Error getting notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب إحصائيات الإشعارات',
        error: error.message
      });
    }
  }
);

module.exports = router;

