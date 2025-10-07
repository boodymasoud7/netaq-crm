const cron = require('node-cron');
const { Notification } = require('../../models');
const { Op } = require('sequelize');

// إعدادات التنظيف
const CLEANUP_CONFIG = {
  // تشغيل كل يوم الساعة 3 صباحاً
  cronPattern: '0 3 * * *',
  // حذف الإشعارات الأقدم من 30 يوم
  retentionDays: 30,
  // الاحتفاظ بحد أقصى 10000 إشعار
  maxNotifications: 10000,
  // حذف الإشعارات المقروءة الأقدم من 7 أيام
  readRetentionDays: 7
};

// دالة تنظيف الإشعارات القديمة
async function cleanupOldNotifications() {
  try {
    console.log('🧹 بدء تنظيف الإشعارات القديمة...');
    
    const now = new Date();
    const retentionDate = new Date(now - CLEANUP_CONFIG.retentionDays * 24 * 60 * 60 * 1000);
    const readRetentionDate = new Date(now - CLEANUP_CONFIG.readRetentionDays * 24 * 60 * 60 * 1000);
    
    // 1. حذف الإشعارات القديمة جداً (أقدم من 30 يوم)
    const deletedOld = await Notification.destroy({
      where: {
        createdAt: {
          [Op.lt]: retentionDate
        }
      }
    });
    
    // 2. حذف الإشعارات المقروءة القديمة (أقدم من 7 أيام)
    const deletedRead = await Notification.destroy({
      where: {
        isRead: true,
        createdAt: {
          [Op.lt]: readRetentionDate
        }
      }
    });
    
    // 3. التحقق من العدد الإجمالي
    const totalCount = await Notification.count();
    
    // 4. إذا تجاوز الحد الأقصى، احذف الأقدم
    if (totalCount > CLEANUP_CONFIG.maxNotifications) {
      const excessCount = totalCount - CLEANUP_CONFIG.maxNotifications;
      
      // جلب IDs الأقدم
      const oldestNotifications = await Notification.findAll({
        attributes: ['id'],
        order: [['createdAt', 'ASC']],
        limit: excessCount
      });
      
      const idsToDelete = oldestNotifications.map(n => n.id);
      
      const deletedExcess = await Notification.destroy({
        where: {
          id: {
            [Op.in]: idsToDelete
          }
        }
      });
      
      console.log(`🗑️ تم حذف ${deletedExcess} إشعار زائد عن الحد الأقصى`);
    }
    
    // إحصائيات التنظيف
    const remainingCount = await Notification.count();
    
    console.log('✅ اكتمل تنظيف الإشعارات:');
    console.log(`   📊 حذف ${deletedOld} إشعار قديم (أقدم من ${CLEANUP_CONFIG.retentionDays} يوم)`);
    console.log(`   📖 حذف ${deletedRead} إشعار مقروء قديم (أقدم من ${CLEANUP_CONFIG.readRetentionDays} أيام)`);
    console.log(`   📈 العدد المتبقي: ${remainingCount} إشعار`);
    
    return {
      deletedOld,
      deletedRead,
      remainingCount
    };
    
  } catch (error) {
    console.error('❌ خطأ في تنظيف الإشعارات:', error);
    throw error;
  }
}

// دالة لبدء تشغيل cron job
function startNotificationCleanupJob() {
  if (!cron.validate(CLEANUP_CONFIG.cronPattern)) {
    console.error('❌ نمط cron غير صحيح:', CLEANUP_CONFIG.cronPattern);
    return false;
  }

  console.log('🚀 بدء تشغيل خدمة تنظيف الإشعارات...');
  console.log(`⏰ نمط الفحص: ${CLEANUP_CONFIG.cronPattern} (كل يوم الساعة 3 صباحاً)`);
  console.log(`📅 الاحتفاظ بالإشعارات لمدة ${CLEANUP_CONFIG.retentionDays} يوم`);
  console.log(`📖 حذف المقروءة بعد ${CLEANUP_CONFIG.readRetentionDays} أيام`);
  console.log(`📊 الحد الأقصى: ${CLEANUP_CONFIG.maxNotifications} إشعار`);
  
  const task = cron.schedule(CLEANUP_CONFIG.cronPattern, async () => {
    await cleanupOldNotifications();
  }, {
    scheduled: true,
    timezone: "Africa/Cairo"
  });

  console.log('✅ خدمة تنظيف الإشعارات تعمل بنجاح');
  return task;
}

// دالة لإيقاف cron job
function stopNotificationCleanupJob(task) {
  if (task) {
    task.stop();
    console.log('⏹️ تم إيقاف خدمة تنظيف الإشعارات');
  }
}

module.exports = {
  startNotificationCleanupJob,
  stopNotificationCleanupJob,
  cleanupOldNotifications,
  CLEANUP_CONFIG
};

