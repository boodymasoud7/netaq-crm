const express = require('express');
const router = express.Router();
const followUpController = require('../controllers/followUpController');
const { authMiddleware } = require('../middleware/simple-auth');

// تطبيق middleware المصادقة على كل الروتس
router.use(authMiddleware);

// Routes للـ Follow-ups

// جلب كل المتابعات مع الفلترة والبحث
// GET /api/follow-ups?page=1&limit=20&status=scheduled&type=call&priority=high&assignedTo=1&date=2025-01-10&search=محمد
router.get('/', followUpController.getAllFollowUps);

// جلب متابعات اليوم للمستخدم الحالي
// GET /api/follow-ups/today
router.get('/today', followUpController.getTodayFollowUps);

// جلب إحصائيات المتابعات
// GET /api/follow-ups/stats
router.get('/stats', followUpController.getFollowUpStats);

// تشغيل المتابعات التلقائية الدورية (للـ admin فقط)
// POST /api/follow-ups/run-automatic
router.post('/run-automatic', (req, res, next) => {
  // التحقق من صلاحيات الإدارة
  if (req.user.role !== 'admin' && req.user.role !== 'sales_manager') {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح لك بتشغيل المتابعات التلقائية'
    });
  }
  next();
}, followUpController.runAutomaticFollowUps);

// إنشاء متابعة جديدة
// POST /api/follow-ups
router.post('/', followUpController.createFollowUp);

// تحديث متابعة
// PUT /api/follow-ups/:id
router.put('/:id', followUpController.updateFollowUp);

// تسجيل إتمام المتابعة
// PUT /api/follow-ups/:id/complete
router.put('/:id/complete', followUpController.completeFollowUp);

// حذف متابعة (Soft Delete / Archive)
// DELETE /api/follow-ups/:id
router.delete('/:id', followUpController.deleteFollowUp);

// جلب المتابعات المأرشفة
// GET /api/follow-ups/archived
router.get('/archived', followUpController.getArchivedFollowUps);

// استعادة متابعة محذوفة
// POST /api/follow-ups/:id/restore
router.post('/:id/restore', followUpController.restoreFollowUp);

// حذف متابعة نهائياً (Hard Delete)
// DELETE /api/follow-ups/:id/permanent
router.delete('/:id/permanent', followUpController.permanentDeleteFollowUp);

// حذف جميع المتابعات المؤرشفة نهائياً
// DELETE /api/follow-ups/archive/all
router.delete('/archive/all', followUpController.permanentDeleteAllFollowUps);

// توزيع متابعات للعملاء المحتملين الموزعين
// POST /api/follow-ups/distribute
router.post('/distribute', followUpController.distributeFollowUps);

// إنشاء متابعات تلقائية لعميل محتمل
// POST /api/follow-ups/auto-create-lead
router.post('/auto-create-lead', followUpController.createAutoLeadFollowUps);

module.exports = router;
