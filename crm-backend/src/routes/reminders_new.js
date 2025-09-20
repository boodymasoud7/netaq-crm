const express = require('express');
const router = express.Router();
const { authMiddleware, requirePermission } = require('../middleware/auth');
const { Reminder } = require('../../models');
const { Op } = require('sequelize');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/reminders
// @desc    Get all reminders with pagination and filtering
// @access  Private (view_tasks permission)
router.get('/', requirePermission('view_tasks'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', priority = '', assignedTo = '' } = req.query;
    
    // Build where conditions
    const whereConditions = {};
    
    // Filter by search term
    if (search) {
      whereConditions[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { assignedToName: { [Op.iLike]: `%${search}%` } },
        { relatedName: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Filter by status
    if (status) {
      whereConditions.status = status;
    }
    
    // Filter by priority
    if (priority) {
      whereConditions.priority = priority;
    }
    
    // Filter by assigned user
    if (assignedTo) {
      whereConditions.assignedTo = parseInt(assignedTo);
    }
    
    // Role-based filtering: sales users see only their reminders
    if (req.user.role === 'sales' || req.user.role === 'sales_agent') {
      whereConditions[Op.or] = [
        { assignedTo: req.user.id },
        { createdBy: req.user.id }
      ];
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    const { count, rows: reminders } = await Reminder.findAndCountAll({
      where: whereConditions,
      order: [['dueDate', 'ASC'], ['priority', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: reminders,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التذكيرات'
    });
  }
});

// @route   POST /api/reminders
// @desc    Create new reminder
// @access  Private (manage_tasks permission)
router.post('/', requirePermission('manage_tasks'), async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      priority,
      dueDate,
      reminderTime,
      assignedTo,
      assignedToName,
      relatedType,
      relatedId,
      relatedName,
      notes
    } = req.body;
    
    // Validation
    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'العنوان وتاريخ الاستحقاق مطلوبان'
      });
    }
    
    // Create new reminder in database
    const newReminder = await Reminder.create({
      title,
      description,
      type: type || 'task',
      priority: priority || 'medium',
      status: 'pending',
      dueDate: new Date(dueDate),
      reminderTime: reminderTime ? new Date(reminderTime) : null,
      assignedTo: assignedTo ? parseInt(assignedTo) : null,
      assignedToName,
      createdBy: req.user.id,
      createdByName: req.user.name || req.user.email || 'غير محدد',
      relatedType,
      relatedId: relatedId ? parseInt(relatedId) : null,
      relatedName,
      notes
    });
    
    res.status(201).json({
      success: true,
      data: newReminder,
      message: 'تم إنشاء التذكير بنجاح'
    });
    
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء التذكير'
    });
  }
});

// @route   GET /api/reminders/:id
// @desc    Get reminder by ID
// @access  Private (view_tasks permission)
router.get('/:id', requirePermission('view_tasks'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const reminder = await Reminder.findByPk(id);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'التذكير غير موجود'
      });
    }
    
    // Check permission: only assigned user, creator, or admin can view
    if (req.user.role !== 'admin' && 
        reminder.assignedTo !== req.user.id && 
        reminder.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذا التذكير'
      });
    }
    
    res.json({
      success: true,
      data: reminder
    });
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التذكير'
    });
  }
});

// @route   PUT /api/reminders/:id
// @desc    Update reminder
// @access  Private (manage_tasks permission)
router.put('/:id', requirePermission('manage_tasks'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const reminder = await Reminder.findByPk(id);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'التذكير غير موجود'
      });
    }
    
    // Check permission: only assigned user, creator, or admin can update
    if (req.user.role !== 'admin' && 
        reminder.assignedTo !== req.user.id && 
        reminder.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتعديل هذا التذكير'
      });
    }
    
    // Update reminder
    await reminder.update(updateData);
    
    res.json({
      success: true,
      data: reminder,
      message: 'تم تحديث التذكير بنجاح'
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث التذكير'
    });
  }
});

// @route   PATCH /api/reminders/:id/complete
// @desc    Mark reminder as completed
// @access  Private (manage_tasks permission)
router.patch('/:id/complete', requirePermission('manage_tasks'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const reminder = await Reminder.findByPk(id);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'التذكير غير موجود'
      });
    }
    
    // Check permission: only assigned user, creator, or admin can complete
    if (req.user.role !== 'admin' && 
        reminder.assignedTo !== req.user.id && 
        reminder.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لإكمال هذا التذكير'
      });
    }
    
    // Mark as completed
    await reminder.update({
      status: 'completed',
      completedAt: new Date(),
      completedBy: req.user.id,
      completedByName: req.user.name || req.user.email || 'غير محدد'
    });
    
    res.json({
      success: true,
      data: reminder,
      message: 'تم وضع علامة على التذكير كمكتمل'
    });
  } catch (error) {
    console.error('Error completing reminder:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إكمال التذكير'
    });
  }
});

// @route   DELETE /api/reminders/:id
// @desc    Delete reminder
// @access  Private (manage_tasks permission)
router.delete('/:id', requirePermission('manage_tasks'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const reminder = await Reminder.findByPk(id);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'التذكير غير موجود'
      });
    }
    
    // Check permission: only creator or admin can delete
    if (req.user.role !== 'admin' && reminder.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لحذف هذا التذكير'
      });
    }
    
    // Delete reminder
    await reminder.destroy();
    
    res.json({
      success: true,
      message: 'تم حذف التذكير بنجاح'
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف التذكير'
    });
  }
});

// @route   GET /api/reminders/dashboard
// @desc    Get dashboard summary of reminders
// @access  Private (view_tasks permission)
router.get('/dashboard', requirePermission('view_tasks'), async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Build base where condition for user's reminders
    let baseWhere = {};
    if (req.user.role === 'sales' || req.user.role === 'sales_agent') {
      baseWhere = {
        [Op.or]: [
          { assignedTo: userId },
          { createdBy: userId }
        ]
      };
    }
    
    // Get summary statistics
    const [overdue, today_reminders, upcoming, total] = await Promise.all([
      Reminder.count({
        where: {
          ...baseWhere,
          status: 'pending',
          dueDate: { [Op.lt]: today }
        }
      }),
      Reminder.count({
        where: {
          ...baseWhere,
          status: 'pending',
          dueDate: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      }),
      Reminder.count({
        where: {
          ...baseWhere,
          status: 'pending',
          dueDate: { [Op.gt]: tomorrow }
        }
      }),
      Reminder.count({
        where: baseWhere
      })
    ]);
    
    res.json({
      success: true,
      data: {
        overdue,
        today: today_reminders,
        upcoming,
        total,
        completed: total - overdue - today_reminders - upcoming
      }
    });
  } catch (error) {
    console.error('Error fetching reminders dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب ملخص التذكيرات'
    });
  }
});

module.exports = router;






