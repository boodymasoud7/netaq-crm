const { Notification } = require('../../models');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const notificationStream = require('../routes/notifications-stream');

// Get user notifications with pagination
exports.getUserNotifications = [
  // Validation rules for query parameters
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be a boolean'),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        page = 1,
        limit = 20,
        unreadOnly = false
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause = {
        targetUserEmail: req.user.email
      };

      if (unreadOnly === 'true' || unreadOnly === true) {
        whereClause.isRead = false;
      }

      console.log('🔍 Fetching notifications for user:', req.user.email);
      console.log('📋 Where clause:', whereClause);
      console.log('📊 Pagination:', { page, limit, offset });

      // Get notifications with pagination
      const { count, rows: notifications } = await Notification.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']], // Latest notifications first
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      console.log(`✅ Found ${notifications.length} notifications (total: ${count}) for user: ${req.user.email}`);

      const totalPages = Math.ceil(count / limit);

      res.json({
        message: 'Notifications retrieved successfully',
        data: notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        message: 'Server error while retrieving notifications',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Mark notification as read
exports.markAsRead = [
  body('notificationIds')
    .isArray({ min: 1 })
    .withMessage('NotificationIds must be a non-empty array'),
  body('notificationIds.*')
    .custom((value) => {
      // Accept both integers (database IDs) and strings (custom notification IDs)
      if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
        return true;
      }
      if (typeof value === 'string' && value.length > 0) {
        return true;
      }
      throw new Error('Each notification ID must be a positive integer or non-empty string');
    }),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { notificationIds } = req.body;

      console.log('🔍 Marking notifications as read:', notificationIds);

      // Separate integer IDs from string IDs
      const integerIds = notificationIds.filter(id => typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id)));
      const stringIds = notificationIds.filter(id => typeof id === 'string' && !/^\d+$/.test(id));

      console.log('🔢 Integer IDs:', integerIds);
      console.log('📝 String IDs:', stringIds);

      let updatedCount = 0;

      // Update notifications with database integer IDs
      if (integerIds.length > 0) {
        const [count1] = await Notification.update(
          { 
            isRead: true, 
            readAt: new Date() 
          },
          {
            where: {
              id: {
                [Op.in]: integerIds.map(id => parseInt(id))
              },
              targetUserEmail: req.user.email
            }
          }
        );
        updatedCount += count1;
      }

      // Update notifications with custom string identifiers (match against relatedId or custom field)
      if (stringIds.length > 0) {
        const [count2] = await Notification.update(
          { 
            isRead: true, 
            readAt: new Date() 
          },
          {
            where: {
              [Op.or]: [
                {
                  relatedId: {
                    [Op.in]: stringIds
                  }
                },
                {
                  id: {
                    [Op.in]: stringIds
                  }
                }
              ],
              targetUserEmail: req.user.email
            }
          }
        );
        updatedCount += count2;
      }

      console.log(`✅ Marked ${updatedCount} notifications as read for ${req.user.email}`);

      res.json({
        message: 'Notifications marked as read successfully',
        updatedCount
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        message: 'Server error while marking notifications as read',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Get unread notifications count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        targetUserEmail: req.user.email,
        isRead: false
      }
    });

    res.json({
      message: 'Unread count retrieved successfully',
      count
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      message: 'Server error while retrieving unread count',
      code: 'SERVER_ERROR'
    });
  }
};

// Save notification (internal function for use by other parts of the system)
exports.saveNotification = async (notificationData) => {
  try {
    const notification = await Notification.create({
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      priority: notificationData.priority || 'medium',
      targetUserEmail: notificationData.targetUserEmail,
      targetUserName: notificationData.targetUserName,
      senderEmail: notificationData.senderEmail,
      senderName: notificationData.senderName,
      data: notificationData.data || {},
      sentViaSSE: notificationData.sentViaSSE || false,
      sentAt: notificationData.sentViaSSE ? new Date() : null
    });

    console.log(`✅ Notification saved to database: ${notification.id} for ${notificationData.targetUserEmail}`);
    return notification;

  } catch (error) {
    console.error('❌ Error saving notification:', error);
    throw error;
  }
};

// Clear all notifications for current user
exports.clearAllNotifications = async (req, res) => {
  try {
    // Delete all notifications for the current user
    const deletedCount = await Notification.destroy({
      where: {
        targetUserEmail: req.user.email
      }
    });

    console.log(`✅ Cleared ${deletedCount} notifications for ${req.user.email}`);

    res.json({
      message: 'All notifications cleared successfully',
      deletedCount
    });

  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({
      message: 'Server error while clearing notifications',
      code: 'SERVER_ERROR'
    });
  }
};

// Delete old notifications (cleanup function)
exports.cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deletedCount = await Notification.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoffDate
        },
        isRead: true // Only delete read notifications
      }
    });

    console.log(`🧹 Cleaned up ${deletedCount} old notifications (older than ${daysOld} days)`);
    return deletedCount;

  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error);
    throw error;
  }
};

// Send notification (for follow-up completion, etc.)
exports.sendNotification = [
  body('type').notEmpty().withMessage('Type is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('employeeName').notEmpty().withMessage('Employee name is required'),
  body('employeeEmail').isEmail().withMessage('Valid employee email is required'),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        type,
        title,
        message,
        icon,
        priority = 'medium',
        employeeName,
        employeeEmail,
        followUpTitle,
        clientName,
        result,
        action
      } = req.body;

      console.log('📤 Sending notification:', { type, title, employeeName });

      // Get all managers (admin and sales_manager roles)
      const { User } = require('../../models');
      const managers = await User.findAll({
        where: {
          role: {
            [Op.in]: ['admin', 'sales_manager']
          },
          status: 'active'
        }
      });

      console.log(`👨‍💼 Found ${managers.length} managers to notify`);

      // Send notification to each manager
      const notifications = [];
      for (const manager of managers) {
        const notificationData = {
          type,
          title,
          message,
          priority,
          targetUserEmail: manager.email,
          targetUserName: manager.name,
          senderEmail: employeeEmail,
          senderName: employeeName,
          data: {
            type,
            icon,
            employeeName,
            employeeEmail,
            followUpTitle,
            clientName,
            result,
            action,
            isManagerNotification: true
          },
          sentViaSSE: false
        };

        const notification = await exports.saveNotification(notificationData);
        notifications.push(notification);
      }

      console.log(`✅ Sent ${notifications.length} notifications to managers`);

      res.json({
        message: 'Notification sent successfully',
        notificationsSent: notifications.length,
        managers: managers.map(m => ({ name: m.name, email: m.email }))
      });

    } catch (error) {
      console.error('Send notification error:', error);
      res.status(500).json({
        message: 'Server error while sending notification',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// دالة لإنشاء إشعار جديد (للاستخدام الداخلي من cron jobs وما شابه)
exports.createNotification = async (notificationData) => {
  try {
    console.log('📬 Creating new notification:', notificationData);

    // البحث عن المستخدم لمعرفة بريده الإلكتروني
    let targetUserEmail = null;
    if (notificationData.userId) {
      const { User } = require('../../models');
      const user = await User.findByPk(notificationData.userId);
      if (user) {
        targetUserEmail = user.email;
      }
    }

    // إنشاء الإشعار في قاعدة البيانات
    const notification = await Notification.create({
      title: notificationData.title || 'إشعار جديد',
      message: notificationData.message || '',
      type: notificationData.type || 'info',
      priority: notificationData.priority || 'normal',
      targetUserEmail: targetUserEmail,
      relatedType: notificationData.relatedType || null,
      relatedId: notificationData.relatedId || null,
      isRead: false
    });

    console.log('✅ Notification created successfully:', notification.id);

    // إرسال الإشعار عبر SSE إذا كان متاحاً
    if (notificationStream && typeof notificationStream.broadcastToUser === 'function') {
      try {
        const sseData = {
          id: notification.id,
          type: 'reminder',
          title: notificationData.title,
          message: notificationData.message,
          timestamp: notification.createdAt.toISOString(),
          priority: notificationData.priority || 'high',
          icon: '🔔'
        };

        // إرسال للمستخدم المحدد إذا توفر بريده الإلكتروني
        if (targetUserEmail) {
          await notificationStream.broadcastToUser(targetUserEmail, sseData);
          console.log('📡 SSE notification sent to user:', targetUserEmail);
        } else {
          // إرسال لجميع المديرين
          await notificationStream.broadcastToManagers(sseData);
          console.log('📡 SSE notification broadcast to managers');
        }
      } catch (sseError) {
        console.error('❌ Error sending SSE notification:', sseError.message);
        // لا نرمي خطأ هنا لأن الإشعار تم حفظه بنجاح
      }
    } else {
      console.warn('⚠️ SSE notification system not available');
    }

    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};
