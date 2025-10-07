const cron = require('node-cron');
const { SimpleReminder, sequelize } = require('../../models');
const { createNotification } = require('../controllers/notificationController');
const { Op } = require('sequelize');

// إعدادات التذكيرات
const REMINDER_CONFIG = {
  // فحص كل دقيقة
  cronPattern: '* * * * *',
  // إرسال إشعار قبل 5 دقائق من موعد التذكير
  earlyNotificationMinutes: 5,
  // أوقات العمل (اختياري - يمكن تعطيله)
  workingHours: {
    enabled: false, // معطل حالياً للاختبار
    start: 8, // 8 صباحاً
    end: 22  // 10 مساءً
  }
};

// دالة لفحص التذكيرات المستحقة
async function checkDueReminders() {
  try {
    console.log('🔍 فحص التذكيرات المستحقة...', new Date().toLocaleString('ar-EG'));

    // التحقق من أوقات العمل
    if (REMINDER_CONFIG.workingHours.enabled) {
      const currentHour = new Date().getHours();
      if (currentHour < REMINDER_CONFIG.workingHours.start || currentHour > REMINDER_CONFIG.workingHours.end) {
        console.log(`⏰ خارج أوقات العمل (الساعة ${currentHour})`);
        return;
      }
    }

    // البحث عن التذكيرات المستحقة باستخدام SimpleReminder model
    const now = new Date();
    const pendingReminders = await SimpleReminder.findAll({
      where: {
        status: 'pending',
        remind_at: {
          [sequelize.Sequelize.Op.lte]: now
        }
      },
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['remind_at', 'ASC']]
    });

    if (pendingReminders.length === 0) {
      console.log('📊 لا توجد تذكيرات مستحقة');
      return;
    }

    console.log(`🔔 تم العثور على ${pendingReminders.length} تذكير مستحق`);

    // معالجة كل تذكير
    for (const reminder of pendingReminders) {
      try {
        await processReminder(reminder);
      } catch (error) {
        console.error(`❌ خطأ في معالجة التذكير ${reminder.id}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ خطأ في فحص التذكيرات:', error);
  }
}

// دالة لمعالجة تذكير واحد
async function processReminder(reminder) {
  try {
    console.log(`📋 معالجة التذكير: ${reminder.note} للمستخدم ${reminder.user_id}`);

    // إنشاء إشعار للمستخدم
    const notificationData = {
      userId: reminder.user_id,
      title: '🔔 تذكير مهم',
      message: reminder.note,
      type: 'reminder',
      relatedType: 'reminder',
      relatedId: reminder.id,
      priority: 'high'
    };

    // إرسال الإشعار (استخدام نفس نظام الإشعارات الموجود)
    await createNotification(notificationData);

    // لا نُغير حالة التذكير هنا - سيقوم المستخدم بتحديدها يدوياً من popup
    // await SimpleReminder.update(
    //   { 
    //     status: 'done'
    //   },
    //   { 
    //     where: { id: reminder.id } 
    //   }
    // );

    console.log(`✅ تم إرسال إشعار للتذكير ${reminder.id} - في انتظار تفاعل المستخدم`);

    // تسجيل إحصائيات
    logReminderStats(reminder);

  } catch (error) {
    console.error(`❌ خطأ في معالجة التذكير ${reminder.id}:`, error);
    throw error;
  }
}

// دالة لتسجيل إحصائيات التذكيرات
function logReminderStats(reminder) {
  const now = new Date();
  const reminderTime = new Date(reminder.remind_at);
  const delayMinutes = Math.round((now - reminderTime) / (1000 * 60));

  console.log(`📊 إحصائيات التذكير ${reminder.id}:`, {
    note: reminder.note.substring(0, 50) + '...',
    scheduledTime: reminderTime.toLocaleString('ar-EG'),
    processedTime: now.toLocaleString('ar-EG'),
    delayMinutes: delayMinutes,
    isLate: delayMinutes > 1
  });
}

// دالة لبدء تشغيل cron job
function startReminderJob() {
  if (!cron.validate(REMINDER_CONFIG.cronPattern)) {
    console.error('❌ نمط cron غير صحيح:', REMINDER_CONFIG.cronPattern);
    return false;
  }

  console.log('🚀 بدء تشغيل خدمة التذكيرات...');
  console.log(`⏰ نمط الفحص: ${REMINDER_CONFIG.cronPattern} (كل دقيقة)`);
  
  const task = cron.schedule(REMINDER_CONFIG.cronPattern, async () => {
    await checkDueReminders();
  }, {
    scheduled: true,
    timezone: "Africa/Cairo"
  });

  // فحص فوري عند بدء التشغيل
  setTimeout(async () => {
    console.log('🔍 فحص فوري عند بدء التشغيل...');
    await checkDueReminders();
  }, 2000);

  console.log('✅ خدمة التذكيرات تعمل بنجاح');
  return task;
}

// دالة لإيقاف cron job
function stopReminderJob(task) {
  if (task) {
    task.stop();
    console.log('⏹️ تم إيقاف خدمة التذكيرات');
    return true;
  }
  return false;
}

// دالة للحصول على إحصائيات التذكيرات
async function getReminderStats() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const stats = {
      pendingTotal: await SimpleReminder.count({ where: { status: 'pending' } }),
      doneToday: await SimpleReminder.count({
        where: {
          status: 'done',
          updatedAt: {
            [sequelize.Sequelize.Op.gte]: startOfDay
          }
        }
      }),
      overdueCount: await SimpleReminder.count({
        where: {
          status: 'pending',
          remind_at: {
            [sequelize.Sequelize.Op.lt]: now
          }
        }
      })
    };

    return stats;
  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات التذكيرات:', error);
    return null;
  }
}

// دالة للتنظيف التلقائي للتذكيرات القديمة (اختياري)
async function cleanupOldReminders() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedCount = await SimpleReminder.destroy({
      where: {
        status: 'done',
        updatedAt: {
          [sequelize.Sequelize.Op.lt]: thirtyDaysAgo
        }
      }
    });

    if (deletedCount > 0) {
      console.log(`🧹 تم حذف ${deletedCount} تذكير قديم`);
    }

    return deletedCount;
  } catch (error) {
    console.error('❌ خطأ في تنظيف التذكيرات القديمة:', error);
    return 0;
  }
}

module.exports = {
  startReminderJob,
  stopReminderJob,
  checkDueReminders,
  getReminderStats,
  cleanupOldReminders,
  REMINDER_CONFIG
};