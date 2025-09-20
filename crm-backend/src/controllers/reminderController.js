const { SimpleReminder, User, sequelize } = require('../../models');
const { Op } = require('sequelize');

// إنشاء تذكير جديد
const createReminder = async (req, res) => {
  try {
    const { note, remind_at, client_id, lead_id, type, priority, description } = req.body;
    const user_id = req.user.id; // من الـ JWT

    if (!note || !remind_at) {
      return res.status(400).json({ 
        success: false, 
        message: 'Note and remind_at are required.' 
      });
    }

    // إعداد بيانات التذكير
    const reminderData = {
      user_id,
      note,
      remind_at: new Date(remind_at),
      status: 'pending'
    };

    // إضافة الحقول الاختيارية إذا كانت متوفرة
    if (client_id) {
      reminderData.client_id = parseInt(client_id);
    }
    if (lead_id) {
      reminderData.lead_id = parseInt(lead_id);
    }
    if (type) {
      reminderData.type = type;
    }
    if (priority) {
      reminderData.priority = priority;
    }
    if (description) {
      reminderData.description = description;
    }

    console.log('🔍 Creating reminder with data:', reminderData);

    // استخدام SimpleReminder model لإنشاء التذكير
    const reminder = await SimpleReminder.create(reminderData);

    res.status(201).json({ 
      success: true, 
      data: reminder 
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating reminder.', 
      error: error.message 
    });
  }
};

// جلب تذكيرات المستخدم الحالي
const getUserReminders = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status, search, from, to, page = 1, limit = 10 } = req.query;

    let whereClause = 'WHERE user_id = $1';
    let binds = [user_id];
    let bindIndex = 2;

    if (status && ['pending', 'done'].includes(status)) {
      whereClause += ` AND status = $${bindIndex}`;
      binds.push(status);
      bindIndex++;
    }

    if (search) {
      whereClause += ` AND note ILIKE $${bindIndex}`;
      binds.push(`%${search}%`);
      bindIndex++;
    }

    if (from) {
      whereClause += ` AND remind_at >= $${bindIndex}`;
      binds.push(new Date(from).toISOString());
      bindIndex++;
    }

    if (to) {
      whereClause += ` AND remind_at <= $${bindIndex}`;
      binds.push(new Date(to).toISOString());
      bindIndex++;
    }

    const offset = (page - 1) * limit;

    // جلب التذكيرات باستخدام SimpleReminder model
    const whereConditions = { user_id };

    if (status && ['pending', 'done'].includes(status)) {
      whereConditions.status = status;
    }

    if (search) {
      whereConditions.note = {
        [Op.iLike]: `%${search}%`
      };
    }

    if (from) {
      whereConditions.remind_at = {
        ...whereConditions.remind_at,
        [Op.gte]: new Date(from)
      };
    }

    if (to) {
      whereConditions.remind_at = {
        ...whereConditions.remind_at,
        [Op.lte]: new Date(to)
      };
    }

    const reminders = await SimpleReminder.findAll({
      where: whereConditions,
      order: [['remind_at', 'ASC']],
      limit: parseInt(limit)
    });

    // عد إجمالي التذكيرات
    const total = await SimpleReminder.count({
      where: whereConditions
    });

    res.status(200).json({
      success: true,
      data: reminders,
      pagination: {
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user reminders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching reminders.', 
      error: error.message 
    });
  }
};

// تحديث تذكير
const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const { note, remind_at, status } = req.body;

    // التحقق من وجود التذكير
    const existing = await SimpleReminder.findOne({
      where: { id, user_id }
    });

    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reminder not found or not authorized.' 
      });
    }

    // تحديث التذكير
    const updateData = {};
    if (note) updateData.note = note;
    if (remind_at) updateData.remind_at = new Date(remind_at);
    if (status) {
      // السماح بتحديث الحالة إلى القيم المقبولة
      const allowedStatuses = ['pending', 'done'];
      if (allowedStatuses.includes(status)) {
        updateData.status = status;
      } else {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}` 
        });
      }
    }

    await existing.update(updateData);

    // إعادة تحميل التذكير المحدث
    await existing.reload();

    res.status(200).json({ 
      success: true, 
      data: existing 
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating reminder.', 
      error: error.message 
    });
  }
};

// حذف تذكير
const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await SimpleReminder.destroy({
      where: { id, user_id }
    });

    if (result === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reminder not found or not authorized.' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Reminder deleted successfully.' 
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting reminder.', 
      error: error.message 
    });
  }
};

// تحديد تذكير كمنجز
const markReminderAsDone = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // التحقق من وجود التذكير
    const existing = await SimpleReminder.findOne({
      where: { id, user_id }
    });

    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Reminder not found or not authorized.' 
      });
    }

    if (existing.status === 'done') {
      console.log(`⚠️ Attempt to complete already done reminder: ${existing.id} by user: ${user_id}`)
      return res.status(400).json({ 
        success: false, 
        message: 'Reminder is already marked as done.' 
      });
    }

    // إذا كان التذكير مرسل من قبل (في description)، يمكن تحديثه لـ "done"
    if (existing.description && existing.description.includes('[NOTIFIED:')) {
      console.log(`🔄 تحديث تذكير مرسل من قبل إلى "done": ${existing.id}`);
    }

    // تحديث الحالة مع طباعة log
    console.log(`✅ Marking reminder as done: ${existing.id} by user: ${user_id}`)
    await existing.update({
      status: 'done'
    });

    // إعادة تحميل التذكير المحدث
    await existing.reload();

    res.status(200).json({ 
      success: true, 
      data: existing 
    });
  } catch (error) {
    console.error('Error marking reminder as done:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error marking reminder as done.', 
      error: error.message 
    });
  }
};

// جلب إحصائيات تذكيرات المستخدم
const getUserReminderStats = async (req, res) => {
  try {
    const user_id = req.user.id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // استخدام SimpleReminder model لجلب الإحصائيات
    const total = await SimpleReminder.count({ where: { user_id } });
    const pending = await SimpleReminder.count({ where: { user_id, status: 'pending' } });
    const done = await SimpleReminder.count({ where: { user_id, status: 'done' } });
    
    const doneToday = await SimpleReminder.count({ 
      where: { 
        user_id, 
        status: 'done',
        updatedAt: { [Op.gte]: startOfDay }
      } 
    });
    
    const overdue = await SimpleReminder.count({ 
      where: { 
        user_id, 
        status: 'pending',
        remind_at: { [Op.lt]: now }
      } 
    });
    
    const upcoming = await SimpleReminder.count({ 
      where: { 
        user_id, 
        status: 'pending',
        remind_at: { [Op.gte]: now }
      } 
    });

    // تحويل النتائج
    const formattedStats = {
      total: total || 0,
      pending: pending || 0,
      done: done || 0,
      doneToday: doneToday || 0,
      overdue: overdue || 0,
      upcoming: upcoming || 0
    };

    res.status(200).json({ 
      success: true, 
      data: formattedStats 
    });
  } catch (error) {
    console.error('Error fetching user reminder stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching reminder stats.', 
      error: error.message 
    });
  }
};

// Get archived/deleted reminders
const getArchivedReminders = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: archivedReminders } = await SimpleReminder.findAndCountAll({
      where: {
        deleted_at: { [Op.ne]: null }
      },
      paranoid: false, // Include soft-deleted records
      order: [['deleted_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      message: 'Archived reminders retrieved successfully',
      data: archivedReminders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching archived reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving archived reminders',
      error: error.message
    });
  }
};

// Restore archived reminder (undo soft delete)
const restoreReminder = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the soft-deleted reminder
    const reminder = await SimpleReminder.findByPk(id, { paranoid: false });
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    if (!reminder.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'Reminder is not archived'
      });
    }

    // Restore the reminder
    await reminder.restore();

    console.log(`✅ Reminder restored: ${reminder.id} by ${req.user?.name || 'system'}`);

    res.json({
      success: true,
      message: 'Reminder restored successfully',
      data: reminder
    });

  } catch (error) {
    console.error('Restore reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while restoring reminder',
      error: error.message
    });
  }
};

// Permanently delete reminder (hard delete)
const permanentDeleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the soft-deleted reminder
    const reminder = await SimpleReminder.findByPk(id, { paranoid: false });
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    if (!reminder.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'Reminder must be archived before permanent deletion'
      });
    }

    const reminderTitle = reminder.title || `Reminder #${reminder.id}`;

    // Permanently delete
    await reminder.destroy({ force: true });

    console.log(`⚠️ Reminder permanently deleted: ${reminderTitle} by ${req.user?.name || 'system'}`);

    res.json({
      success: true,
      message: 'Reminder permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while permanently deleting reminder',
      error: error.message
    });
  }
};

// Delete all archived reminders permanently
const permanentDeleteAllReminders = async (req, res) => {
  try {
    // Find all soft-deleted reminders
    const archivedReminders = await SimpleReminder.findAll({ 
      paranoid: false,
      where: {
        deleted_at: {
          [Op.not]: null
        }
      }
    });

    if (archivedReminders.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No archived reminders found to delete',
        deletedCount: 0
      });
    }

    const count = archivedReminders.length;
    
    // Permanently delete all archived reminders
    await SimpleReminder.destroy({ 
      force: true,
      paranoid: false,
      where: {
        deleted_at: {
          [Op.not]: null
        }
      }
    });

    console.log(`⚠️ ${count} reminders permanently deleted by ${req.user?.name || 'system'}`);

    res.json({
      success: true,
      message: `${count} archived reminders permanently deleted`,
      deletedCount: count
    });

  } catch (error) {
    console.error('Permanent delete all reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while permanently deleting all reminders',
      error: error.message
    });
  }
};

module.exports = {
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
};