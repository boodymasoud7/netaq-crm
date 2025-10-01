const { Project } = require('../../models');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');

// Get all projects with pagination and filtering
exports.getAllProjects = [
  // Validation rules for query parameters
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
  query('status').optional().isIn(['planning', 'under_construction', 'completed', 'on_hold', 'cancelled', 'مؤرشف', 'archived']).withMessage('Invalid status'),
  
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
        limit = 100,
        search = '',
        status = '',
        location = '',
        developer = '',
        minCompletion = '',
        maxCompletion = '',
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = {};
      
      // Projects are visible to all users (no role-based filtering for now)
      
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { location: { [Op.iLike]: `%${search}%` } },
          { developer: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (status) whereConditions.status = status;
      if (location) whereConditions.location = { [Op.iLike]: `%${location}%` };
      if (developer) whereConditions.developer = { [Op.iLike]: `%${developer}%` };
      
      if (minCompletion || maxCompletion) {
        whereConditions.completion = {};
        if (minCompletion) whereConditions.completion[Op.gte] = parseInt(minCompletion);
        if (maxCompletion) whereConditions.completion[Op.lte] = parseInt(maxCompletion);
      }

      // Get projects with pagination
      const { count, rows: projects } = await Project.findAndCountAll({
        where: whereConditions,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        message: 'Projects retrieved successfully',
        data: projects,
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
      console.error('Get all projects error:', error);
      res.status(500).json({
        message: 'Server error while retrieving projects',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Get single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    res.json({
      message: 'Project retrieved successfully',
      data: project
    });

  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      message: 'Server error while retrieving project',
      code: 'SERVER_ERROR'
    });
  }
};

// Create new project
exports.createProject = [
  // Validation rules
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Project name must be at least 2 characters long'),
  body('location')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Location must be at least 2 characters long'),
  body('developer')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Developer name must be at least 2 characters long'),
  body('totalUnits')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total units must be a positive integer'),
  body('availableUnits')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available units must be a non-negative integer'),
  body('priceRange')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Price range must be at least 2 characters long'),
  body('status')
    .isIn(['planning', 'under_construction', 'construction', 'completed', 'on_hold', 'cancelled', 'مؤرشف', 'archived'])
    .withMessage('Invalid status'),
  body('completion')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Completion must be between 0 and 100'),

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
        location,
        developer,
        totalUnits,
        availableUnits,
        priceRange,
        status,
        completion,
        amenities,
        description
      } = req.body;

      // Validate available units doesn't exceed total units
      if (availableUnits > totalUnits) {
        return res.status(400).json({
          message: 'Available units cannot exceed total units',
          code: 'INVALID_UNITS'
        });
      }

      const project = await Project.create({
        name,
        location,
        developer,
        totalUnits,
        availableUnits,
        priceRange,
        status: status || 'planning',
        completion: completion || 0,
        amenities: amenities || [],
        description: description || ''
      });

      console.log(`✅ New project created: ${project.name} by ${req.user.name}`);

      res.status(201).json({
        message: 'Project created successfully',
        data: project
      });

    } catch (error) {
      console.error('Create project error:', error);
      
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
        message: 'Server error while creating project',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Update project
exports.updateProject = [
  // Validation rules
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Project name must be at least 2 characters long'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Location must be at least 2 characters long'),
  body('developer')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Developer name must be at least 2 characters long'),
  body('totalUnits')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total units must be a positive integer'),
  body('availableUnits')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available units must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['planning', 'under_construction', 'construction', 'completed', 'on_hold', 'cancelled', 'مؤرشف', 'archived'])
    .withMessage('Invalid status'),
  body('completion')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Completion must be between 0 and 100'),

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

      // Check if project exists
      const project = await Project.findByPk(id);
      if (!project) {
        return res.status(404).json({
          message: 'Project not found',
          code: 'PROJECT_NOT_FOUND'
        });
      }

      // Validate available units doesn't exceed total units
      const totalUnits = updateData.totalUnits || project.totalUnits;
      const availableUnits = updateData.availableUnits || project.availableUnits;
      
      if (availableUnits > totalUnits) {
        return res.status(400).json({
          message: 'Available units cannot exceed total units',
          code: 'INVALID_UNITS'
        });
      }

      await project.update(updateData);

      console.log(`✅ Project updated: ${project.name} by ${req.user.name}`);

      res.json({
        message: 'Project updated successfully',
        data: project
      });

    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        message: 'Server error while updating project',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    await project.destroy();
    
    // Debug: Check if soft delete worked
    const deletedProject = await Project.findByPk(id, { paranoid: false });
    console.log(`✅ Project deleted: ${project.name} by ${req.user.name}`);
    console.log(`🔍 Deleted project deleted_at:`, deletedProject?.deleted_at);

    res.json({
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      message: 'Server error while deleting project',
      code: 'SERVER_ERROR'
    });
  }
};

// Get project statistics
exports.getProjectStats = async (req, res) => {
  try {
    const statusStats = await Project.findAll({
      attributes: [
        'status',
        [Project.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    const locationStats = await Project.findAll({
      attributes: [
        'location',
        [Project.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['location'],
      order: [[Project.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 10
    });

    const developerStats = await Project.findAll({
      attributes: [
        'developer',
        [Project.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['developer'],
      order: [[Project.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 10
    });

    const totalProjects = await Project.count();
    
    const unitsStats = await Project.findAll({
      attributes: [
        [Project.sequelize.fn('SUM', Project.sequelize.col('totalUnits')), 'totalUnits'],
        [Project.sequelize.fn('SUM', Project.sequelize.col('availableUnits')), 'availableUnits']
      ],
      raw: true
    });

    const completionStats = await Project.findAll({
      attributes: [
        [Project.sequelize.fn('AVG', Project.sequelize.col('completion')), 'averageCompletion'],
        [Project.sequelize.fn('MAX', Project.sequelize.col('completion')), 'maxCompletion'],
        [Project.sequelize.fn('MIN', Project.sequelize.col('completion')), 'minCompletion']
      ],
      raw: true
    });

    const soldUnits = unitsStats[0].totalUnits - unitsStats[0].availableUnits;
    const salesRate = unitsStats[0].totalUnits > 0 ? 
      ((soldUnits / unitsStats[0].totalUnits) * 100).toFixed(2) : 0;

    res.json({
      message: 'Project statistics retrieved successfully',
      data: {
        totalProjects,
        statusDistribution: statusStats.reduce((acc, stat) => {
          acc[stat.dataValues.status] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        locationDistribution: locationStats.map(stat => ({
          location: stat.dataValues.location,
          count: parseInt(stat.dataValues.count)
        })),
        developerDistribution: developerStats.map(stat => ({
          developer: stat.dataValues.developer,
          count: parseInt(stat.dataValues.count)
        })),
        unitsStats: {
          totalUnits: parseInt(unitsStats[0].totalUnits) || 0,
          availableUnits: parseInt(unitsStats[0].availableUnits) || 0,
          soldUnits: soldUnits || 0,
          salesRate: parseFloat(salesRate)
        },
        completionStats: {
          averageCompletion: parseFloat(completionStats[0].averageCompletion) || 0,
          maxCompletion: parseInt(completionStats[0].maxCompletion) || 0,
          minCompletion: parseInt(completionStats[0].minCompletion) || 0
        }
      }
    });

  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      message: 'Server error while retrieving project statistics',
      code: 'SERVER_ERROR'
    });
  }
};

// Get archived/deleted projects
exports.getArchivedProjects = [
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
        [Op.and]: [
          // Archived condition (soft deleted OR status archived)
          {
            [Op.or]: [
              { deleted_at: { [Op.ne]: null } }, // Soft deleted records
              { status: 'مؤرشف' }, // Status-based archived records
              { status: 'archived' } // English status archived records
            ]
          }
        ]
      };
      
      // Add search condition if provided
      if (search) {
        whereConditions[Op.and].push({
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { location: { [Op.iLike]: `%${search}%` } },
            { developer: { [Op.iLike]: `%${search}%` } }
          ]
        });
      }

      // Get archived projects only
      const { count, rows: archivedProjects } = await Project.findAndCountAll({
        where: whereConditions,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        paranoid: false // Include soft deleted records
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        message: 'Archived projects retrieved successfully',
        data: archivedProjects,
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
      console.error('Get archived projects error:', error);
      res.status(500).json({
        message: 'Server error while retrieving archived projects',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Restore archived project (undo soft delete)
exports.restoreProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the archived project (soft deleted OR status archived)
    const project = await Project.findByPk(id, { paranoid: false });
    
    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    // Check if project is actually archived
    const isArchived = project.deleted_at || project.status === 'مؤرشف' || project.status === 'archived';
    if (!isArchived) {
      return res.status(400).json({
        message: 'Project is not archived',
        code: 'PROJECT_NOT_ARCHIVED'
      });
    }

    // Restore the project
    if (project.deleted_at) {
      // Restore soft deleted project
      await project.restore();
    } else {
      // Restore status-archived project
      await project.update({ status: 'planning' }); // Reset to default status
    }

    console.log(`✅ Project restored: ${project.name} by ${req.user.name}`);

    res.json({
      message: 'Project restored successfully',
      data: project
    });

  } catch (error) {
    console.error('Restore project error:', error);
    res.status(500).json({
      message: 'Server error while restoring project',
      code: 'SERVER_ERROR'
    });
  }
};

// Permanently delete project (hard delete)
exports.permanentDeleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the archived project (soft deleted OR status archived)
    const project = await Project.findByPk(id, { paranoid: false });
    
    if (!project) {
      return res.status(404).json({
        message: 'Project not found',
        code: 'PROJECT_NOT_FOUND'
      });
    }

    // Check if project is actually archived
    const isArchived = project.deleted_at || project.status === 'مؤرشف' || project.status === 'archived';
    if (!isArchived) {
      return res.status(400).json({
        message: 'Project must be archived before permanent deletion',
        code: 'PROJECT_NOT_ARCHIVED'
      });
    }

    const projectName = project.name;
    
    // Permanently delete
    await project.destroy({ force: true });

    console.log(`⚠️ Project permanently deleted: ${projectName} by ${req.user.name}`);

    res.json({
      message: 'Project permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete project error:', error);
    res.status(500).json({
      message: 'Server error while permanently deleting project',
      code: 'SERVER_ERROR'
    });
  }
};

