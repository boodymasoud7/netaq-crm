const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { authMiddleware } = require('../middleware/auth');

// تطبيق middleware المصادقة على كل الروتس
router.use(authMiddleware);

// Routes للتفاعلات

// جلب كل التفاعلات مع الفلترة والبحث
// GET /api/interactions?page=1&limit=20&type=call&status=completed&outcome=interested&leadId=1&clientId=2&dateFrom=2025-01-01&dateTo=2025-01-31&search=محمد
router.get('/', interactionController.getAllInteractions);

// جلب الخط الزمني للتفاعلات (لعميل أو عميل محتمل)
// GET /api/interactions/timeline/lead/123
// GET /api/interactions/timeline/client/456
router.get('/timeline/:entityType/:entityId', interactionController.getTimeline);

// جلب إحصائيات التفاعلات
// GET /api/interactions/stats?userId=1&dateFrom=2025-01-01&dateTo=2025-01-31
router.get('/stats', interactionController.getInteractionStats);

// تسجيل مكالمة سريع
// POST /api/interactions/quick-call
router.post('/quick-call', interactionController.quickCallLog);

// إنشاء تفاعل جديد
// POST /api/interactions
router.post('/', interactionController.createInteraction);

// تحديث تفاعل
// PUT /api/interactions/:id
router.put('/:id', interactionController.updateInteraction);

// حذف تفاعل (Soft Delete)
// DELETE /api/interactions/:id
router.delete('/:id', interactionController.deleteInteraction);

module.exports = router;