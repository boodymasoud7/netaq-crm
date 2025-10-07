const { Client, User, Note, Interaction } = require('../../models');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');

// Get all clients with pagination and filtering
exports.getAllClients = [
  // Validation rules for query parameters
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
  query('status').optional().isIn(['active', 'inactive', 'potential', 'converted']).withMessage('Invalid status'),
  query('source').optional().isLength({ min: 1 }).withMessage('Source cannot be empty'),
  
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
        source = '',
        assignedTo = '',
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = {};
      
      // Role-based filtering: sales users can only see their own clients
      const userRole = req.user.role;
      const userId = req.user.id;
      
      if (userRole === 'sales' || userRole === 'sales_agent' || userRole === 'employee') {
        console.log('📊 Backend: Filtering clients for sales user:', userId);
        // Sales users can only see clients assigned to them (by user ID, name, or email)
        whereConditions[Op.or] = [
          { assignedTo: userId.toString() },
          { assignedTo: req.user.name },
          { assignedTo: req.user.email }
        ];
      }
      // Admin and sales_manager can see all clients (no additional filtering)
      
      // Allow managers to filter by assigned user
      if (assignedTo && (userRole === 'admin' || userRole === 'sales_manager')) {
        whereConditions.assignedTo = assignedTo;
      }
      
      if (search) {
        const searchCondition = {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { phone: { [Op.iLike]: `%${search}%` } },
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

      if (status) {
        whereConditions.status = status;
      }

      if (source) {
        whereConditions.source = source;
      }

      // Get clients with pagination and include assigned user name
      const { count, rows: rawClients } = await Client.findAndCountAll({
        where: whereConditions,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Get counts for all clients efficiently
      const clientIds = rawClients.map(client => client.id);
      
      // Get notes counts for all clients at once
      const notesCounts = await Note.count({
        where: {
          itemType: 'client',
          itemId: { [Op.in]: clientIds }
        },
        group: ['itemId']
      });
      
      // Get interactions counts for all clients at once
      const interactionsCounts = await Interaction.count({
        where: {
          itemType: 'client',
          itemId: { [Op.in]: clientIds }
        },
        group: ['itemId']
      });
      
      // Create count maps
      const notesCountMap = {};
      const interactionsCountMap = {};
      
      // Process notes counts (Sequelize returns array of {itemId, count})
      if (Array.isArray(notesCounts)) {
        notesCounts.forEach(item => {
          notesCountMap[item.itemId] = item.count;
        });
      }
      
      // Process interactions counts
      if (Array.isArray(interactionsCounts)) {
        interactionsCounts.forEach(item => {
          interactionsCountMap[item.itemId] = item.count;
        });
      }

      // Enrich clients with assigned user names and counts
      const clients = await Promise.all(rawClients.map(async (client) => {
        const clientData = client.toJSON();
        
        // Try to get assigned user name if assignedTo exists
        if (clientData.assignedTo) {
          try {
            // Check if assignedTo is a number (ID) or string (name)
            const isNumericId = !isNaN(clientData.assignedTo) && Number.isInteger(Number(clientData.assignedTo));
            
            let assignedUser = null;
            
            if (isNumericId) {
              // Find by ID
              assignedUser = await User.findByPk(Number(clientData.assignedTo), {
                attributes: ['name']
              });
            } else {
              // Find by name (for legacy data)
              assignedUser = await User.findOne({
                where: { name: clientData.assignedTo },
                attributes: ['name']
              });
            }
            
            if (assignedUser) {
              clientData.assignedToName = assignedUser.name;
            } else {
              clientData.assignedToName = clientData.assignedTo; // fallback to stored value
            }
          } catch (error) {
            console.error('Error fetching assigned user name:', error);
            clientData.assignedToName = clientData.assignedTo; // fallback to stored value
          }
        }
        
        // Add notes and interactions counts from maps
        clientData.notesCount = notesCountMap[clientData.id] || 0;
        clientData.interactionsCount = interactionsCountMap[clientData.id] || 0;
        
        return clientData;
      }));

      const totalPages = Math.ceil(count / limit);

      res.json({
        message: 'Clients retrieved successfully',
        data: clients,
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
      console.error('Get all clients error:', error);
      res.status(500).json({
        message: 'Server error while retrieving clients',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Get single client by ID
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findByPk(id);

    if (!client) {
      return res.status(404).json({
        message: 'Client not found',
        code: 'CLIENT_NOT_FOUND'
      });
    }

    res.json({
      message: 'Client retrieved successfully',
      data: client
    });

  } catch (error) {
    console.error('Get client by ID error:', error);
    res.status(500).json({
      message: 'Server error while retrieving client',
      code: 'SERVER_ERROR'
    });
  }
};

// Create new client
exports.createClient = [
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
  body('budget')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('status')
    .isIn(['active', 'inactive', 'potential', 'converted'])
    .withMessage('Invalid status'),
  body('source')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Source must be at least 2 characters long'),

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
        address,
        budget,
        status,
        source,
        notes,
        assignedTo,
        lastContact
      } = req.body;

      // Check if client with same email already exists
      if (email) {
        const existingClient = await Client.findOne({ where: { email } });
        if (existingClient) {
          return res.status(400).json({
            message: 'Client with this email already exists',
            code: 'CLIENT_EXISTS'
          });
        }
      }

      console.log('Creating client with user info:', {
        userId: req.user.id,
        userName: req.user.name,
        userEmail: req.user.email
      });

      const client = await Client.create({
        name,
        email,
        phone,
        address,
        budget,
        status,
        source,
        notes,
        assignedTo: assignedTo || req.user.id || null,
        lastContact: lastContact ? new Date(lastContact) : new Date()
      });

      console.log(`✅ New client created: ${client.name} by ${req.user.name}`);
      console.log(`🚫 NO AUTO FOLLOW-UP for clients - ID: ${client.id}`);

      res.status(201).json({
        message: 'Client created successfully',
        data: client
      });

    } catch (error) {
      console.error('Create client error:', error);
      
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
        message: 'Server error while creating client',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Update client
exports.updateClient = [
  // Validation rules
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Phone number must be at least 10 characters'),
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'potential', 'converted'])
    .withMessage('Invalid status'),

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

      // Check if client exists
      const client = await Client.findByPk(id);
      if (!client) {
        return res.status(404).json({
          message: 'Client not found',
          code: 'CLIENT_NOT_FOUND'
        });
      }

      // Check if email is being changed and already exists
      if (updateData.email && updateData.email !== client.email) {
        const existingClient = await Client.findOne({
          where: { email: updateData.email, id: { [Op.ne]: id } }
        });
        if (existingClient) {
          return res.status(400).json({
            message: 'Another client with this email already exists',
            code: 'EMAIL_EXISTS'
          });
        }
      }

      // Update lastContact if not provided but status is being updated
      if (updateData.status && !updateData.lastContact) {
        updateData.lastContact = new Date();
      }

      await client.update(updateData);

      console.log(`✅ Client updated: ${client.name} by ${req.user.name}`);

      res.json({
        message: 'Client updated successfully',
        data: client
      });

    } catch (error) {
      console.error('Update client error:', error);
      res.status(500).json({
        message: 'Server error while updating client',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.username || 'مستخدم غير معرف';

    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({
        message: 'Client not found',
        code: 'CLIENT_NOT_FOUND'
      });
    }

    // Update with deleted_by info before soft delete
    await client.update({
      deleted_by: userId
    });

    await client.destroy();
    
    console.log(`✅ Client deleted: ${client.name} by ${userName} (ID: ${userId})`);

    res.json({
      message: 'Client deleted successfully'
    });

  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      message: 'Server error while deleting client',
      code: 'SERVER_ERROR'
    });
  }
};

// Get client statistics
exports.getClientStats = async (req, res) => {
  try {
    const stats = await Client.findAll({
      attributes: [
        'status',
        [Client.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    const totalClients = await Client.count();
    
    const sourceStats = await Client.findAll({
      attributes: [
        'source',
        [Client.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['source'],
      order: [[Client.sequelize.fn('COUNT', '*'), 'DESC']]
    });

    const budgetStats = await Client.findAll({
      attributes: [
        [Client.sequelize.fn('AVG', Client.sequelize.col('budget')), 'averageBudget'],
        [Client.sequelize.fn('SUM', Client.sequelize.col('budget')), 'totalBudget'],
        [Client.sequelize.fn('MAX', Client.sequelize.col('budget')), 'maxBudget'],
        [Client.sequelize.fn('MIN', Client.sequelize.col('budget')), 'minBudget']
      ],
      raw: true
    });

    res.json({
      message: 'Client statistics retrieved successfully',
      data: {
        totalClients,
        statusDistribution: stats.reduce((acc, stat) => {
          acc[stat.dataValues.status] = parseInt(stat.dataValues.count);
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
    console.error('Get client stats error:', error);
    res.status(500).json({
      message: 'Server error while retrieving client statistics',
      code: 'SERVER_ERROR'
    });
  }
};

// Get archived/deleted clients
exports.getArchivedClients = [
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

      // Get archived clients only
      const { count, rows: archivedClients } = await Client.findAndCountAll({
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

      const archivedCount = count;

      const totalPages = Math.ceil(archivedCount / limit);

      res.json({
        message: 'Archived clients retrieved successfully',
        data: archivedClients,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: archivedCount,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      console.error('Get archived clients error:', error);
      res.status(500).json({
        message: 'Server error while retrieving archived clients',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Restore archived client (undo soft delete)
exports.restoreClient = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the soft-deleted client
    const client = await Client.findByPk(id, { paranoid: false });
    
    if (!client) {
      return res.status(404).json({
        message: 'Client not found',
        code: 'CLIENT_NOT_FOUND'
      });
    }

    if (!client.deleted_at) {
      return res.status(400).json({
        message: 'Client is not archived',
        code: 'CLIENT_NOT_ARCHIVED'
      });
    }

    // Restore the client
    await client.restore();

    console.log(`✅ Client restored: ${client.name} by ${req.user.name}`);

    res.json({
      message: 'Client restored successfully',
      data: client
    });

  } catch (error) {
    console.error('Restore client error:', error);
    res.status(500).json({
      message: 'Server error while restoring client',
      code: 'SERVER_ERROR'
    });
  }
};

// Permanently delete client (hard delete)
exports.permanentDeleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the soft-deleted client
    const client = await Client.findByPk(id, { paranoid: false });
    
    if (!client) {
      return res.status(404).json({
        message: 'Client not found',
        code: 'CLIENT_NOT_FOUND'
      });
    }

    if (!client.deleted_at) {
      return res.status(400).json({
        message: 'Client must be archived before permanent deletion',
        code: 'CLIENT_NOT_ARCHIVED'
      });
    }

    const clientName = client.name;
    
    // Permanently delete
    await client.destroy({ force: true });

    console.log(`⚠️ Client permanently deleted: ${clientName} by ${req.user.name}`);

    res.json({
      message: 'Client permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete client error:', error);
    res.status(500).json({
      message: 'Server error while permanently deleting client',
      code: 'SERVER_ERROR'
    });
  }
};

// Delete all archived clients permanently
exports.permanentDeleteAllClients = async (req, res) => {
  try {
    // Find all soft-deleted clients
    const archivedClients = await Client.findAll({ 
      paranoid: false,
      where: {
        deleted_at: {
          [Op.not]: null
        }
      }
    });

    if (archivedClients.length === 0) {
      return res.status(200).json({
        message: 'No archived clients found to delete',
        deletedCount: 0
      });
    }

    const count = archivedClients.length;
    
    // Permanently delete all archived clients
    await Client.destroy({ 
      force: true,
      paranoid: false,
      where: {
        deleted_at: {
          [Op.not]: null
        }
      }
    });

    console.log(`⚠️ ${count} clients permanently deleted by ${req.user.name}`);

    res.json({
      message: `${count} archived clients permanently deleted`,
      deletedCount: count
    });

  } catch (error) {
    console.error('Permanent delete all clients error:', error);
    res.status(500).json({
      message: 'Server error while permanently deleting all clients',
      code: 'SERVER_ERROR'
    });
  }
};