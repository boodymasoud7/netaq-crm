const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  createReminder,
  getUserReminders,
  updateReminder,
  deleteReminder,
  markReminderAsDone,
  getUserReminderStats,
  getArchivedReminders,
  restoreReminder,
  permanentDeleteReminder,
  permanentDeleteAllReminders
} = require('../controllers/reminderController');

// تطبيق middleware للمصادقة على جميع المسارات
router.use(authMiddleware);

// POST /api/reminders - إنشاء تذكير جديد
router.post('/', createReminder);

// GET /api/reminders - جلب تذكيرات المستخدم الحالي
router.get('/', getUserReminders);

// GET /api/reminders/stats - جلب إحصائيات تذكيرات المستخدم
router.get('/stats', getUserReminderStats);

// GET /api/reminders/system-stats - معطل مؤقتاً
// router.get('/system-stats', getSystemReminderStats);

// PUT /api/reminders/:id - تحديث تذكير
router.put('/:id', updateReminder);

// DELETE /api/reminders/:id - حذف تذكير
router.delete('/:id', deleteReminder);

// PATCH /api/reminders/:id/done - تحديد تذكير كمنجز
router.patch('/:id/done', markReminderAsDone);

// GET /api/reminders/archived - جلب التذكيرات المأرشفة
router.get('/archived', getArchivedReminders);

// POST /api/reminders/:id/restore - استعادة تذكير محذوف
router.post('/:id/restore', restoreReminder);

// DELETE /api/reminders/:id/permanent - حذف تذكير نهائياً
router.delete('/:id/permanent', permanentDeleteReminder);

// DELETE /api/reminders/archive/all - حذف جميع التذكيرات المؤرشفة نهائياً
router.delete('/archive/all', permanentDeleteAllReminders);

module.exports = router;