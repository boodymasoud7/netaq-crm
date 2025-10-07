const { Task, User } = require('../../models');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');

// Get all tasks with pagination and filtering
exports.getAllTasks = [
  // Validation rules for query parameters
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
  query('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('category').optional().isIn(['follow_up', 'meeting', 'call', 'email', 'site_visit', 'documentation', 'other']).withMessage('Invalid category'),
  
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
        limit = 10,
        search = '',
        status = '',
        priority = '',
        category = '',
        assignedTo = '',
        overdue = '',
        fromDate = '',
        toDate = '',
        sortBy = 'dueDate',
        sortOrder = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = {};
      
      if (search) {
        whereConditions[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { leadName: { [Op.iLike]: `%${search}%` } },
          { assignedTo: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (status) whereConditions.status = status;
      if (priority) whereConditions.priority = priority;
      if (category) whereConditions.category = category;
      if (assignedTo) whereConditions.assignedTo = { [Op.iLike]: `%${assignedTo}%` };
      
      // Date range filter
      if (fromDate || toDate) {
        whereConditions.dueDate = {};
        if (fromDate) whereConditions.dueDate[Op.gte] = new Date(fromDate);
        if (toDate) whereConditions.dueDate[Op.lte] = new Date(toDate);
      }

      // Overdue filter
      if (overdue === 'true') {
        whereConditions.dueDate = { [Op.lt]: new Date() };
        whereConditions.status = { [Op.ne]: 'completed' };
      }

      // Get tasks with pagination
      const { count, rows: tasks } = await Task.findAndCountAll({
        where: whereConditions,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        message: 'Tasks retrieved successfully',
        data: tasks,
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
      console.error('Get all tasks error:', error);
      res.status(500).json({
        message: 'Server error while retrieving tasks',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Get single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
        code: 'TASK_NOT_FOUND'
      });
    }

    res.json({
      message: 'Task retrieved successfully',
      data: task
    });

  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({
      message: 'Server error while retrieving task',
      code: 'SERVER_ERROR'
    });
  }
};

// Create new task
exports.createTask = [
  // Validation rules
  body('title')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Task title must be at least 2 characters long'),
  body('description')
    .optional()
    .trim()
    .custom((value) => {
      // Allow empty string or require at least 5 characters
      if (!value || value === '' || value.length >= 5) {
        return true;
      }
      throw new Error('Description must be empty or at least 5 characters long');
    }),
  body('assignedTo')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Assigned to must be at least 2 characters long'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('category')
    .isIn(['follow_up', 'meeting', 'call', 'email', 'site_visit', 'documentation', 'other'])
    .withMessage('Invalid category'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),

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
        title,
        description,
        assignedTo,
        dueDate,
        priority,
        status,
        category,
        progress,
        tags,
        leadName
      } = req.body;

      const task = await Task.create({
        title,
        description: description || '',
        assignedTo,
        dueDate: new Date(dueDate),
        priority,
        status: status || 'pending',
        category,
        progress: progress || 0,
        tags: tags || [],
        leadName: leadName || ''
      });

      console.log(`✅ New task created: ${task.title} assigned to ${task.assignedTo} by ${req.user.name}`);

      res.status(201).json({
        message: 'Task created successfully',
        data: task
      });

    } catch (error) {
      console.error('Create task error:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        message: 'Server error while creating task',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Update task
exports.updateTask = [
  // Validation rules
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Task title must be at least 2 characters long'),
  body('description')
    .optional()
    .trim()
    .custom((value) => {
      // Allow empty string or require at least 5 characters
      if (value === '' || value.length >= 5) {
        return true;
      }
      throw new Error('Description must be empty or at least 5 characters long');
    }),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('category')
    .optional()
    .isIn(['follow_up', 'meeting', 'call', 'email', 'site_visit', 'documentation', 'other'])
    .withMessage('Invalid category'),
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Check if task exists
      const task = await Task.findByPk(id);
      if (!task) {
        return res.status(404).json({
          message: 'Task not found',
          code: 'TASK_NOT_FOUND'
        });
      }

      // Auto-update progress based on status
      if (updateData.status) {
        if (updateData.status === 'completed' && !updateData.progress) {
          updateData.progress = 100;
        } else if (updateData.status === 'in_progress' && updateData.progress === 0) {
          updateData.progress = 25;
        }
      }

      // Auto-update status based on progress
      if (updateData.progress !== undefined) {
        if (updateData.progress === 100 && task.status !== 'completed') {
          updateData.status = 'completed';
        } else if (updateData.progress > 0 && updateData.progress < 100 && task.status === 'pending') {
          updateData.status = 'in_progress';
        }
      }

      await task.update(updateData);

      console.log(`✅ Task updated: ${task.title} by ${req.user.name}`);

      res.json({
        message: 'Task updated successfully',
        data: task
      });

    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({
        message: 'Server error while updating task',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.username || 'مستخدم غير معرف';

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        message: 'Task not found',
        code: 'TASK_NOT_FOUND'
      });
    }

    // Update with deleted_by info before soft delete
    await task.update({
      deleted_by: userId
    });

    await task.destroy();

    console.log(`✅ Task deleted: ${task.title} by ${userName} (ID: ${userId})`);

    res.json({
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      message: 'Server error while deleting task',
      code: 'SERVER_ERROR'
    });
  }
};

// Get my tasks (tasks assigned to current user)
exports.getMyTasks = async (req, res) => {
  try {
    const {
      status = '',
      priority = '',
      category = '',
      overdue = '',
      limit = 20
    } = req.query;

    const whereConditions = {
      assignedTo: req.user.name
    };

    if (status) whereConditions.status = status;
    if (priority) whereConditions.priority = priority;
    if (category) whereConditions.category = category;
    
    if (overdue === 'true') {
      whereConditions.dueDate = { [Op.lt]: new Date() };
      whereConditions.status = { [Op.ne]: 'completed' };
    }

    const tasks = await Task.findAll({
      where: whereConditions,
      order: [
        ['priority', 'DESC'],
        ['dueDate', 'ASC']
      ],
      limit: parseInt(limit)
    });

    res.json({
      message: 'Your tasks retrieved successfully',
      data: tasks
    });

  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      message: 'Server error while retrieving your tasks',
      code: 'SERVER_ERROR'
    });
  }
};

// Get task statistics
exports.getTaskStats = async (req, res) => {
  try {
    const { assignedTo } = req.query;

    // Base where condition
    let baseWhere = {};
    if (assignedTo) {
      baseWhere.assignedTo = assignedTo;
    }

    const statusStats = await Task.findAll({
      where: baseWhere,
      attributes: [
        'status',
        [Task.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    const priorityStats = await Task.findAll({
      where: baseWhere,
      attributes: [
        'priority',
        [Task.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['priority']
    });

    const categoryStats = await Task.findAll({
      where: baseWhere,
      attributes: [
        'category',
        [Task.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['category'],
      order: [[Task.sequelize.fn('COUNT', '*'), 'DESC']]
    });

    const assigneeStats = await Task.findAll({
      where: baseWhere,
      attributes: [
        'assignedTo',
        [Task.sequelize.fn('COUNT', '*'), 'totalTasks'],
        [Task.sequelize.fn('AVG', Task.sequelize.col('progress')), 'averageProgress']
      ],
      group: ['assignedTo'],
      order: [[Task.sequelize.fn('COUNT', '*'), 'DESC']]
    });

    const totalTasks = await Task.count({ where: baseWhere });
    const completedTasks = await Task.count({ 
      where: { ...baseWhere, status: 'completed' } 
    });
    const overdueTasks = await Task.count({
      where: {
        ...baseWhere,
        dueDate: { [Op.lt]: new Date() },
        status: { [Op.ne]: 'completed' }
      }
    });

    const progressStats = await Task.findAll({
      where: baseWhere,
      attributes: [
        [Task.sequelize.fn('AVG', Task.sequelize.col('progress')), 'averageProgress'],
        [Task.sequelize.fn('MAX', Task.sequelize.col('progress')), 'maxProgress'],
        [Task.sequelize.fn('MIN', Task.sequelize.col('progress')), 'minProgress']
      ],
      raw: true
    });

    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;
    const overdueRate = totalTasks > 0 ? ((overdueTasks / totalTasks) * 100).toFixed(2) : 0;

    // Tasks due this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const tasksDueThisWeek = await Task.count({
      where: {
        ...baseWhere,
        dueDate: {
          [Op.between]: [startOfWeek, endOfWeek]
        },
        status: { [Op.ne]: 'completed' }
      }
    });

    res.json({
      message: 'Task statistics retrieved successfully',
      data: {
        overview: {
          totalTasks,
          completedTasks,
          overdueTasks,
          tasksDueThisWeek,
          completionRate: parseFloat(completionRate),
          overdueRate: parseFloat(overdueRate),
          ...progressStats[0]
        },
        statusDistribution: statusStats.reduce((acc, stat) => {
          acc[stat.dataValues.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        priorityDistribution: priorityStats.reduce((acc, stat) => {
          acc[stat.dataValues.priority] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        categoryDistribution: categoryStats.map(stat => ({
          category: stat.dataValues.category,
          count: parseInt(stat.dataValues.count)
        })),
        assigneePerformance: assigneeStats.map(stat => ({
          assignedTo: stat.dataValues.assignedTo,
          totalTasks: parseInt(stat.dataValues.totalTasks),
          averageProgress: parseFloat(stat.dataValues.averageProgress) || 0
        }))
      }
    });

  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      message: 'Server error while retrieving task statistics',
      code: 'SERVER_ERROR'
    });
  }
};

// Get archived/deleted tasks
exports.getArchivedTasks = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: archivedTasks } = await Task.findAndCountAll({
      where: {
        deleted_at: { [Op.ne]: null }
      },
      include: [{
        model: User,
        as: 'deletedByUser',
        attributes: ['id', 'name', 'username', 'email'],
        required: false
      }],
      paranoid: false, // Include soft-deleted records
      order: [['deleted_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`✅ Found ${count} archived tasks`);

    res.json({
      success: true,
      data: archivedTasks,
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
    console.error('Error fetching archived tasks:', error);
    res.status(500).json({
      message: 'Server error while retrieving archived tasks',
      code: 'SERVER_ERROR'
    });
  }
};

// Restore archived task (undo soft delete)
exports.restoreTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the soft-deleted task
    const task = await Task.findByPk(id, { paranoid: false });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!task.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'Task is not archived'
      });
    }

    // Restore the task
    await task.restore();

    console.log(`✅ Task restored: ${task.title} by ${req.user?.name || 'system'}`);

    res.json({
      success: true,
      message: 'Task restored successfully',
      data: task
    });

  } catch (error) {
    console.error('Restore task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while restoring task',
      error: error.message
    });
  }
};

// Permanently delete task (hard delete)
exports.permanentDeleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the soft-deleted task
    const task = await Task.findByPk(id, { paranoid: false });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!task.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'Task must be archived before permanent deletion'
      });
    }

    const taskTitle = task.title;

    // Permanently delete
    await task.destroy({ force: true });

    console.log(`⚠️ Task permanently deleted: ${taskTitle} by ${req.user?.name || 'system'}`);

    res.json({
      success: true,
      message: 'Task permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while permanently deleting task',
      error: error.message
    });
  }
};

// Delete all archived tasks permanently
exports.permanentDeleteAllTasks = async (req, res) => {
  try {
    // Find all soft-deleted tasks
    const archivedTasks = await Task.findAll({ 
      paranoid: false,
      where: {
        deleted_at: {
          [Op.not]: null
        }
      }
    });

    if (archivedTasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No archived tasks found to delete',
        deletedCount: 0
      });
    }

    const count = archivedTasks.length;
    
    // Permanently delete all archived tasks
    await Task.destroy({ 
      force: true,
      paranoid: false,
      where: {
        deleted_at: {
          [Op.not]: null
        }
      }
    });

    console.log(`⚠️ ${count} tasks permanently deleted by ${req.user?.name || 'system'}`);

    res.json({
      success: true,
      message: `${count} archived tasks permanently deleted`,
      deletedCount: count
    });

  } catch (error) {
    console.error('Permanent delete all tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while permanently deleting all tasks',
      error: error.message
    });
  }
};
