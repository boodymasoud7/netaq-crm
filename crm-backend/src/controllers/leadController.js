const { Lead, User, FollowUp } = require('../../models');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');
const AutoFollowUpService = require('../services/autoFollowUpService');

// Get all leads with pagination and filtering
exports.getAllLeads = [
  // Validation rules for query parameters
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
  query('status').optional().isIn(['new', 'contacted', 'interested', 'qualified', 'converted', 'lost']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  
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
        limit = 50,
        search = '',
        status = '',
        priority = '',
        source = '',
        assignedTo = '',
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = {};
      
      // Role-based filtering: sales users can only see their own leads
      const userRole = req.user.role;
      const userId = req.user.id;
      
      if (userRole === 'sales' || userRole === 'sales_agent') {
        // Sales users can only see leads assigned to them or created by them
        whereConditions[Op.or] = [
          { assignedTo: userId.toString() },
          { assignedTo: req.user.name },
          { createdBy: userId.toString() },
          { createdBy: req.user.name }
        ];
      }
      // Admin and sales_manager can see all leads (no additional filtering)
      
      if (search) {
        const searchCondition = {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { phone: { [Op.iLike]: `%${search}%` } },
            { interest: { [Op.iLike]: `%${search}%` } },
            { notes: { [Op.iLike]: `%${search}%` } }
          ]
        };
        
        // If role-based filtering exists, combine with search
        if (whereConditions[Op.or]) {
          whereConditions[Op.and] = [
            { [Op.or]: whereConditions[Op.or] }, // Role filter
            searchCondition // Search filter
          ];
          delete whereConditions[Op.or];
        } else {
          whereConditions[Op.or] = searchCondition[Op.or];
        }
      }

      if (status) whereConditions.status = status;
      if (priority) whereConditions.priority = priority;
      if (source) whereConditions.source = source;
      if (assignedTo) whereConditions.assignedTo = assignedTo;

      // Get leads with pagination
      const { count, rows: rawLeads } = await Lead.findAndCountAll({
        where: whereConditions,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      console.log(`📊 Lead query results: found ${count} total leads, returning ${rawLeads.length} for page ${page}`);

      // Optimize: Get all unique user IDs first to avoid N+1 queries
      const allUserIds = [...new Set([
        ...rawLeads.map(lead => lead.assignedTo).filter(Boolean),
        ...rawLeads.map(lead => lead.createdBy).filter(Boolean)
      ])];

      // Fetch all users in one query (only if we have user IDs)
      let users = [];
      if (allUserIds.length > 0) {
        users = await User.findAll({
          where: {
            id: { [Op.in]: allUserIds.filter(id => !isNaN(id) && Number.isInteger(Number(id))) }
          },
          attributes: ['id', 'name']
        });
      }

      // Create lookup maps
      const userByIdMap = {};
      const userByNameMap = {};
      users.forEach(user => {
        userByIdMap[user.id] = user.name;
        userByNameMap[user.name] = user.name;
      });

      // Enrich leads with user names efficiently
      const leads = rawLeads.map(lead => {
        const leadData = lead.toJSON();
        
        // Add assigned user name
        if (leadData.assignedTo) {
          leadData.assignedToName = userByIdMap[leadData.assignedTo] || userByNameMap[leadData.assignedTo] || leadData.assignedTo;
        }
        
        // Add created by user name  
        if (leadData.createdBy) {
          leadData.createdByName = userByIdMap[leadData.createdBy] || userByNameMap[leadData.createdBy] || leadData.createdBy;
        }
        
        return leadData;
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        message: 'Leads retrieved successfully',
        data: leads,
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
      console.error('Get all leads error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      res.status(500).json({
        message: 'Server error while retrieving leads',
        code: 'SERVER_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
];

// Get single lead by ID
exports.getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({
        message: 'Lead not found',
        code: 'LEAD_NOT_FOUND'
      });
    }

    res.json({
      message: 'Lead retrieved successfully',
      data: lead
    });

  } catch (error) {
    console.error('Get lead by ID error:', error);
    res.status(500).json({
      message: 'Server error while retrieving lead',
      code: 'SERVER_ERROR'
    });
  }
};

// Create new lead
exports.createLead = [
  // Validation rules
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 characters'),
  body('interest')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Interest must be at least 2 characters long'),
  body('budget')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('status')
    .isIn(['new', 'contacted', 'interested', 'qualified', 'converted', 'lost'])
    .withMessage('Invalid status'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('source')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Source must be at least 2 characters long'),
  body('notes')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage('Notes must be a string'),
  body('company')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage('Company must be a string'),
  body('clientType')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage('Client type must be a string'),
  body('score')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Score must be a positive number'),

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
        name,
        email,
        phone,
        company,
        interest,
        budget,
        status,
        source,
        priority,
        notes,
        clientType,
        score,
        assignedTo
      } = req.body;

      const lead = await Lead.create({
        name,
        email,
        phone,
        company,
        interest,
        budget,
        status: status || 'new',
        source,
        priority: priority || 'medium',
        notes,
        clientType,
        score: score || 0,
        assignedTo: assignedTo, // لا نحط assignedTo تلقائياً - يبقى null للتوزيع التلقائي
        createdBy: req.user.id || req.user.name
      });

      console.log(`✅ New lead created: ${lead.name} by ${req.user.name}`);

      // إنشاء متابعة إذا تم تخصيص موظف مسؤول
      if (assignedTo) {
        try {
          await AutoFollowUpService.createLeadFollowUps(lead.id, assignedTo, req.user.id);
          console.log(`🎯 Follow-up created for new lead: ${lead.name} → User ${assignedTo}`);
        } catch (error) {
          console.error('⚠️ Failed to create follow-up for new lead:', error);
          // لا نوقف العملية إذا فشلت المتابعات
        }
      }

      res.status(201).json({
        message: 'Lead created successfully',
        data: lead
      });

    } catch (error) {
      console.error('Create lead error:', error);
      
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
        message: 'Server error while creating lead',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Update lead
exports.updateLead = [
  // Validation rules
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 characters'),
  body('budget')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('status')
    .optional()
    .isIn(['new', 'contacted', 'interested', 'qualified', 'converted', 'lost'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),

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

      // Check if lead exists
      const lead = await Lead.findByPk(id);
      if (!lead) {
        return res.status(404).json({
          message: 'Lead not found',
          code: 'LEAD_NOT_FOUND'
        });
      }

      // حفظ البيانات القديمة للمقارنة
      const oldStatus = lead.status;
      const oldAssignedTo = lead.assignedTo;

      await lead.update(updateData);

      console.log(`✅ Lead updated: ${lead.name} by ${req.user.name}`);

      // إدارة المتابعات عند تغيير المسؤول
      try {
        if (updateData.assignedTo && updateData.assignedTo !== oldAssignedTo) {
          
          if (!oldAssignedTo || oldAssignedTo === null) {
            // التوزيع الأول - إنشاء متابعة جديدة
            await AutoFollowUpService.createLeadFollowUps(lead.id, updateData.assignedTo, req.user.id);
            
          } else {
            // تغيير المسؤول - نقل المتابعات الموجودة
            await FollowUp.update(
              { 
                assignedTo: updateData.assignedTo,
                updatedAt: new Date()
              },
              {
                where: {
                  leadId: lead.id,
                  status: { [Op.in]: ['pending'] }
                }
              }
            );
          }
        }
      } catch (error) {
        console.error('⚠️ Failed to update follow-ups for assignment change:', error);
        // لا نوقف العملية إذا فشلت إدارة المتابعات
      }

      // إنشاء متابعة تلقائية إذا تغيرت الحالة
      try {
        if (updateData.status && updateData.status !== oldStatus && lead.assignedTo) {
          await AutoFollowUpService.createFollowUpBasedOnStatus(
            lead.id, 
            updateData.status, 
            lead.assignedTo
          );
          console.log(`🤖 Status-based follow-up created for lead: ${lead.id} (${oldStatus} → ${updateData.status})`);
        }
      } catch (error) {
        console.error('⚠️ Failed to create status-based follow-up:', error);
        // لا نوقف العملية إذا فشلت المتابعات التلقائية
      }

      res.json({
        message: 'Lead updated successfully',
        data: lead
      });

    } catch (error) {
      console.error('Update lead error:', error);
      res.status(500).json({
        message: 'Server error while updating lead',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Delete lead (soft delete)
exports.deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.username || 'مستخدم غير معرف';

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        message: 'Lead not found',
        code: 'LEAD_NOT_FOUND'
      });
    }

    // Update with deleted_by info before soft delete
    await lead.update({
      deleted_by: userId
    });

    await lead.destroy();
    
    console.log(`✅ Lead deleted: ${lead.name} by ${userName} (ID: ${userId})`);

    res.json({
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      message: 'Server error while deleting lead',
      code: 'SERVER_ERROR'
    });
  }
};

// Convert lead to client
exports.convertToClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { Client } = require('../../models');

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({
        message: 'Lead not found',
        code: 'LEAD_NOT_FOUND'
      });
    }

    if (lead.status === 'converted') {
      return res.status(400).json({
        message: 'Lead is already converted',
        code: 'ALREADY_CONVERTED'
      });
    }

    // Create client from lead data
    const client = await Client.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      budget: lead.budget,
      status: 'active',
      source: lead.source,
      notes: `Converted from lead. Original interest: ${lead.interest}\n\nPrevious notes: ${lead.notes || 'None'}`,
      assignedTo: lead.assignedTo,
      lastContact: new Date()
    });

    // Update lead status to converted
    await lead.update({ status: 'converted' });

    console.log(`✅ Lead converted to client: ${lead.name} → ${client.name} by ${req.user.name}`);

    res.json({
      message: 'Lead converted to client successfully',
      data: {
        lead,
        client
      }
    });

  } catch (error) {
    console.error('Convert lead error:', error);
    res.status(500).json({
      message: 'Server error while converting lead',
      code: 'SERVER_ERROR'
    });
  }
};

// Get lead statistics
exports.getLeadStats = async (req, res) => {
  try {
    const statusStats = await Lead.findAll({
      attributes: [
        'status',
        [Lead.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    const priorityStats = await Lead.findAll({
      attributes: [
        'priority',
        [Lead.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['priority']
    });

    const sourceStats = await Lead.findAll({
      attributes: [
        'source',
        [Lead.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['source'],
      order: [[Lead.sequelize.fn('COUNT', '*'), 'DESC']]
    });

    const totalLeads = await Lead.count();
    const convertedLeads = await Lead.count({ where: { status: 'converted' } });
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

    const budgetStats = await Lead.findAll({
      attributes: [
        [Lead.sequelize.fn('AVG', Lead.sequelize.col('budget')), 'averageBudget'],
        [Lead.sequelize.fn('SUM', Lead.sequelize.col('budget')), 'totalBudget'],
        [Lead.sequelize.fn('MAX', Lead.sequelize.col('budget')), 'maxBudget'],
        [Lead.sequelize.fn('MIN', Lead.sequelize.col('budget')), 'minBudget']
      ],
      raw: true
    });

    res.json({
      message: 'Lead statistics retrieved successfully',
      data: {
        totalLeads,
        convertedLeads,
        conversionRate: parseFloat(conversionRate),
        statusDistribution: statusStats.reduce((acc, stat) => {
          acc[stat.dataValues.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        priorityDistribution: priorityStats.reduce((acc, stat) => {
          acc[stat.dataValues.priority] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        sourceDistribution: sourceStats.map(stat => ({
          source: stat.dataValues.source,
          count: parseInt(stat.dataValues.count)
        })),
        budgetStats: budgetStats[0]
      }
    });

  } catch (error) {
    console.error('Get lead stats error:', error);
    res.status(500).json({
      message: 'Server error while retrieving lead statistics',
      code: 'SERVER_ERROR'
    });
  }
};

// Get archived/deleted leads
exports.getArchivedLeads = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
  
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
        limit = 50,
        search = '',
        sortBy = 'deleted_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where conditions for archived items only
      const whereConditions = {
        deleted_at: { [Op.ne]: null } // Only get soft deleted records
      };
      
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get archived leads only
      const { count, rows: archivedLeads } = await Lead.findAndCountAll({
        where: whereConditions,
        include: [{
          model: User,
          as: 'deletedByUser',
          attributes: ['id', 'name', 'username', 'email'],
          required: false
        }],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        paranoid: false // Include soft deleted records
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        message: 'Archived leads retrieved successfully',
        data: archivedLeads,
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
      console.error('Get archived leads error:', error);
      res.status(500).json({
        message: 'Server error while retrieving archived leads',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Restore archived lead (undo soft delete)
exports.restoreLead = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the soft-deleted lead
    const lead = await Lead.findByPk(id, { paranoid: false });
    
    if (!lead) {
      return res.status(404).json({
        message: 'Lead not found',
        code: 'LEAD_NOT_FOUND'
      });
    }

    if (!lead.deleted_at) {
      return res.status(400).json({
        message: 'Lead is not archived',
        code: 'LEAD_NOT_ARCHIVED'
      });
    }

    // Restore the lead
    await lead.restore();

    console.log(`✅ Lead restored: ${lead.name} by ${req.user.name}`);

    res.json({
      message: 'Lead restored successfully',
      data: lead
    });

  } catch (error) {
    console.error('Restore lead error:', error);
    res.status(500).json({
      message: 'Server error while restoring lead',
      code: 'SERVER_ERROR'
    });
  }
};

// Permanently delete lead (hard delete)
exports.permanentDeleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the soft-deleted lead
    const lead = await Lead.findByPk(id, { paranoid: false });
    
    if (!lead) {
      return res.status(404).json({
        message: 'Lead not found',
        code: 'LEAD_NOT_FOUND'
      });
    }

    if (!lead.deleted_at) {
      return res.status(400).json({
        message: 'Lead must be archived before permanent deletion',
        code: 'LEAD_NOT_ARCHIVED'
      });
    }

    const leadName = lead.name;
    
    // Permanently delete
    await lead.destroy({ force: true });

    console.log(`⚠️ Lead permanently deleted: ${leadName} by ${req.user.name}`);

    res.json({
      message: 'Lead permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete lead error:', error);
    res.status(500).json({
      message: 'Server error while permanently deleting lead',
      code: 'SERVER_ERROR'
    });
  }
};

// Delete all archived leads permanently
exports.permanentDeleteAllLeads = async (req, res) => {
  try {
    // Find all soft-deleted leads
    const archivedLeads = await Lead.findAll({ 
      paranoid: false,
      where: {
        deleted_at: {
          [Op.not]: null
        }
      }
    });

    if (archivedLeads.length === 0) {
      return res.status(200).json({
        message: 'No archived leads found to delete',
        deletedCount: 0
      });
    }

    const count = archivedLeads.length;
    
    // Permanently delete all archived leads
    await Lead.destroy({ 
      force: true,
      paranoid: false,
      where: {
        deleted_at: {
          [Op.not]: null
        }
      }
    });

    console.log(`⚠️ ${count} leads permanently deleted by ${req.user.name}`);

    res.json({
      message: `${count} archived leads permanently deleted`,
      deletedCount: count
    });

  } catch (error) {
    console.error('Permanent delete all leads error:', error);
    res.status(500).json({
      message: 'Server error while permanently deleting all leads',
      code: 'SERVER_ERROR'
    });
  }
};
