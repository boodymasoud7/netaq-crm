const { Sale, Client, Project } = require('../../models');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');

// Get all sales with pagination and filtering
exports.getAllSales = [
  // Validation rules for query parameters
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
  query('status').optional().isIn(['pending', 'completed', 'cancelled', 'refunded']).withMessage('Invalid status'),
  
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
        salesPerson = '',
        unitType = '',
        fromDate = '',
        toDate = '',
        minPrice = '',
        maxPrice = '',
        sortBy = 'saleDate',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = {};
      
      // Role-based filtering: sales users can only see their own sales
      const userRole = req.user.role;
      const userId = req.user.id;
      const userName = req.user.name;
      
      if (userRole === 'sales' || userRole === 'sales_agent') {
        // Sales users can only see sales by their name
        whereConditions.salesPerson = userName;
      }
      // Admin and sales_manager can see all sales (no additional filtering)
      
      if (search) {
        const searchCondition = {
          [Op.or]: [
            { clientName: { [Op.iLike]: `%${search}%` } },
            { projectName: { [Op.iLike]: `%${search}%` } },
            { salesPerson: { [Op.iLike]: `%${search}%` } },
            { unitType: { [Op.iLike]: `%${search}%` } }
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
      if (salesPerson) whereConditions.salesPerson = { [Op.iLike]: `%${salesPerson}%` };
      if (unitType) whereConditions.unitType = { [Op.iLike]: `%${unitType}%` };
      
      // Date range filter
      if (fromDate || toDate) {
        whereConditions.saleDate = {};
        if (fromDate) whereConditions.saleDate[Op.gte] = new Date(fromDate);
        if (toDate) whereConditions.saleDate[Op.lte] = new Date(toDate);
      }

      // Price range filter
      if (minPrice || maxPrice) {
        whereConditions.price = {};
        if (minPrice) whereConditions.price[Op.gte] = parseFloat(minPrice);
        if (maxPrice) whereConditions.price[Op.lte] = parseFloat(maxPrice);
      }

      // Get sales with pagination
      const { count, rows: sales } = await Sale.findAndCountAll({
        where: whereConditions,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        message: 'Sales retrieved successfully',
        data: sales,
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
      console.error('Get all sales error:', error);
      res.status(500).json({
        message: 'Server error while retrieving sales',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Get single sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findByPk(id);

    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found',
        code: 'SALE_NOT_FOUND'
      });
    }

    res.json({
      message: 'Sale retrieved successfully',
      data: sale
    });

  } catch (error) {
    console.error('Get sale by ID error:', error);
    res.status(500).json({
      message: 'Server error while retrieving sale',
      code: 'SERVER_ERROR'
    });
  }
};

// Create new sale
exports.createSale = [
  // Validation rules
  body('clientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Client ID must be a positive integer'),
  body('clientName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Client name must be at least 2 characters long'),
  body('projectId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer'),
  body('projectName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Project name must be at least 2 characters long'),
  body('unitType')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Unit type must be at least 2 characters long'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('commission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Commission must be a positive number'),
  body('downPayment')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Down payment must be a positive number'),
  body('installments')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Installments must be a positive integer'),
  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission rate must be between 0 and 100'),
  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'partial', 'completed', 'overdue'])
    .withMessage('Invalid payment status'),
  body('status')
    .isIn(['pending', 'completed', 'cancelled', 'refunded'])
    .withMessage('Invalid status'),
  body('saleDate')
    .optional()
    .isISO8601()
    .withMessage('Sale date must be a valid date'),

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
        clientId,
        clientName,
        projectId,
        projectName,
        unitType,
        unitId,
        unitNumber,
        price,
        downPayment,
        installments,
        commission,
        commissionRate,
        totalAmount,
        status,
        paymentStatus,
        saleDate,
        salesPerson,
        notes
      } = req.body;

      // Verify client exists if clientId provided
      if (clientId) {
        const client = await Client.findByPk(clientId);
        if (!client) {
          return res.status(404).json({
            message: 'Client not found',
            code: 'CLIENT_NOT_FOUND'
          });
        }
      }

      // Verify project exists if projectId provided
      if (projectId) {
        const project = await Project.findByPk(projectId);
        if (!project) {
          return res.status(404).json({
            message: 'Project not found',
            code: 'PROJECT_NOT_FOUND'
          });
        }

        // Check if project has available units (only if availableUnits is set)
        if (project.availableUnits !== null && project.availableUnits <= 0) {
          return res.status(400).json({
            message: 'No available units in this project',
            code: 'NO_AVAILABLE_UNITS'
          });
        }
      }

      // Calculate default commission if not provided (5% of price)
      const finalCommission = commission !== undefined ? commission : (price * 0.05);

      const sale = await Sale.create({
        clientId: clientId || null,
        clientName,
        projectId: projectId || null,
        projectName,
        unitType,
        unitId: unitId || null,
        unitNumber: unitNumber || null,
        price,
        downPayment: downPayment || 0,
        installments: installments || 0,
        commission: finalCommission,
        commissionRate: commissionRate || 0,
        totalAmount: totalAmount || price || 0,
        status: status || 'pending',
        paymentStatus: paymentStatus || 'pending',
        saleDate: saleDate ? new Date(saleDate) : new Date(),
        salesPerson: salesPerson || req.user.name,
        notes: notes || null
      });

      // If project exists and sale is completed, update available units (only if availableUnits is tracked)
      if (projectId && status === 'completed') {
        const project = await Project.findByPk(projectId);
        if (project && project.availableUnits !== null) {
          await Project.decrement('availableUnits', { where: { id: projectId } });
        }
      }

      console.log(`✅ New sale created: ${sale.clientName} - ${sale.projectName} by ${req.user.name}`);

      res.status(201).json({
        message: 'Sale created successfully',
        data: sale
      });

    } catch (error) {
      console.error('Create sale error:', error);
      
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
        message: 'Server error while creating sale',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Update sale
exports.updateSale = [
  // Validation rules
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('commission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Commission must be a positive number'),
  body('downPayment')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Down payment must be a positive number'),
  body('installments')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Installments must be a positive integer'),
  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission rate must be between 0 and 100'),
  body('totalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'partial', 'completed', 'overdue'])
    .withMessage('Invalid payment status'),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled', 'refunded'])
    .withMessage('Invalid status'),
  body('saleDate')
    .optional()
    .isISO8601()
    .withMessage('Sale date must be a valid date'),

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

      // Check if sale exists
      const sale = await Sale.findByPk(id);
      if (!sale) {
        return res.status(404).json({
          message: 'Sale not found',
          code: 'SALE_NOT_FOUND'
        });
      }

      const oldStatus = sale.status;
      const newStatus = updateData.status || oldStatus;

      // Handle project units when status changes
      if (sale.projectId && oldStatus !== newStatus) {
        if (oldStatus === 'completed' && newStatus !== 'completed') {
          // Sale was completed, now changing to another status - add unit back
          const project = await Project.findByPk(sale.projectId);
          if (project && project.availableUnits !== null) {
            await Project.increment('availableUnits', { where: { id: sale.projectId } });
          }
        } else if (oldStatus !== 'completed' && newStatus === 'completed') {
          // Sale wasn't completed, now marking as completed - remove unit
          const project = await Project.findByPk(sale.projectId);
          if (project && project.availableUnits !== null && project.availableUnits > 0) {
            await Project.decrement('availableUnits', { where: { id: sale.projectId } });
          } else if (project && project.availableUnits !== null && project.availableUnits <= 0) {
            return res.status(400).json({
              message: 'No available units in this project',
              code: 'NO_AVAILABLE_UNITS'
            });
          }
        }
      }

      await sale.update(updateData);

      console.log(`✅ Sale updated: ${sale.clientName} - ${sale.projectName} by ${req.user.name}`);

      res.json({
        message: 'Sale updated successfully',
        data: sale
      });

    } catch (error) {
      console.error('Update sale error:', error);
      res.status(500).json({
        message: 'Server error while updating sale',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Delete sale
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findByPk(id);
    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found',
        code: 'SALE_NOT_FOUND'
      });
    }

    // If sale was completed and had a project, add unit back (only if availableUnits is tracked)
    if (sale.status === 'completed' && sale.projectId) {
      const project = await Project.findByPk(sale.projectId);
      if (project && project.availableUnits !== null) {
        await Project.increment('availableUnits', { where: { id: sale.projectId } });
      }
    }

    await sale.destroy();
    
    // Debug: Check if soft delete worked
    const deletedSale = await Sale.findByPk(id, { paranoid: false });
    console.log(`✅ Sale deleted: ${sale.clientName} - ${sale.projectName} by ${req.user.name}`);
    console.log(`🔍 Deleted sale deleted_at:`, deletedSale?.deleted_at);

    res.json({
      message: 'Sale deleted successfully'
    });

  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({
      message: 'Server error while deleting sale',
      code: 'SERVER_ERROR'
    });
  }
};

// Get sales statistics
exports.getSalesStats = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    // Base where condition for date filtering
    let dateCondition = {};
    if (fromDate || toDate) {
      dateCondition.saleDate = {};
      if (fromDate) dateCondition.saleDate[Op.gte] = new Date(fromDate);
      if (toDate) dateCondition.saleDate[Op.lte] = new Date(toDate);
    }

    const statusStats = await Sale.findAll({
      where: dateCondition,
      attributes: [
        'status',
        [Sale.sequelize.fn('COUNT', '*'), 'count'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('price')), 'totalValue']
      ],
      group: ['status']
    });

    const salesPersonStats = await Sale.findAll({
      where: { ...dateCondition, status: 'completed' },
      attributes: [
        'salesPerson',
        [Sale.sequelize.fn('COUNT', '*'), 'count'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('price')), 'totalValue'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('commission')), 'totalCommission']
      ],
      group: ['salesPerson'],
      order: [[Sale.sequelize.fn('SUM', Sale.sequelize.col('price')), 'DESC']]
    });

    const projectStats = await Sale.findAll({
      where: { ...dateCondition, status: 'completed' },
      attributes: [
        'projectName',
        [Sale.sequelize.fn('COUNT', '*'), 'count'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('price')), 'totalValue']
      ],
      group: ['projectName'],
      order: [[Sale.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 10
    });

    const unitTypeStats = await Sale.findAll({
      where: { ...dateCondition, status: 'completed' },
      attributes: [
        'unitType',
        [Sale.sequelize.fn('COUNT', '*'), 'count'],
        [Sale.sequelize.fn('AVG', Sale.sequelize.col('price')), 'averagePrice']
      ],
      group: ['unitType'],
      order: [[Sale.sequelize.fn('COUNT', '*'), 'DESC']]
    });

    const totalSales = await Sale.count({ where: dateCondition });
    const completedSales = await Sale.count({ 
      where: { ...dateCondition, status: 'completed' } 
    });

    const revenueStats = await Sale.findAll({
      where: { ...dateCondition, status: 'completed' },
      attributes: [
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('price')), 'totalRevenue'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('commission')), 'totalCommission'],
        [Sale.sequelize.fn('AVG', Sale.sequelize.col('price')), 'averageSaleValue'],
        [Sale.sequelize.fn('MAX', Sale.sequelize.col('price')), 'highestSale'],
        [Sale.sequelize.fn('MIN', Sale.sequelize.col('price')), 'lowestSale']
      ],
      raw: true
    });

    // Monthly sales trend (last 12 months)
    const monthlyStats = await Sale.findAll({
      where: {
        ...dateCondition,
        status: 'completed',
        saleDate: {
          [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12))
        }
      },
      attributes: [
        [Sale.sequelize.fn('DATE_TRUNC', 'month', Sale.sequelize.col('saleDate')), 'month'],
        [Sale.sequelize.fn('COUNT', '*'), 'count'],
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('price')), 'totalValue']
      ],
      group: [Sale.sequelize.fn('DATE_TRUNC', 'month', Sale.sequelize.col('saleDate'))],
      order: [[Sale.sequelize.fn('DATE_TRUNC', 'month', Sale.sequelize.col('saleDate')), 'ASC']]
    });

    const conversionRate = totalSales > 0 ? ((completedSales / totalSales) * 100).toFixed(2) : 0;

    res.json({
      message: 'Sales statistics retrieved successfully',
      data: {
        overview: {
          totalSales,
          completedSales,
          conversionRate: parseFloat(conversionRate),
          ...revenueStats[0]
        },
        statusDistribution: statusStats.reduce((acc, stat) => {
          acc[stat.dataValues.status] = {
            count: parseInt(stat.dataValues.count),
            totalValue: parseFloat(stat.dataValues.totalValue) || 0
          };
          return acc;
        }, {}),
        salesPersonPerformance: salesPersonStats.map(stat => ({
          salesPerson: stat.dataValues.salesPerson,
          count: parseInt(stat.dataValues.count),
          totalValue: parseFloat(stat.dataValues.totalValue) || 0,
          totalCommission: parseFloat(stat.dataValues.totalCommission) || 0
        })),
        projectPerformance: projectStats.map(stat => ({
          projectName: stat.dataValues.projectName,
          count: parseInt(stat.dataValues.count),
          totalValue: parseFloat(stat.dataValues.totalValue) || 0
        })),
        unitTypeDistribution: unitTypeStats.map(stat => ({
          unitType: stat.dataValues.unitType,
          count: parseInt(stat.dataValues.count),
          averagePrice: parseFloat(stat.dataValues.averagePrice) || 0
        })),
        monthlyTrend: monthlyStats.map(stat => ({
          month: stat.dataValues.month,
          count: parseInt(stat.dataValues.count),
          totalValue: parseFloat(stat.dataValues.totalValue) || 0
        }))
      }
    });

  } catch (error) {
    console.error('Get sales stats error:', error);
    res.status(500).json({
      message: 'Server error while retrieving sales statistics',
      code: 'SERVER_ERROR'
    });
  }
};

// Get archived/deleted sales
exports.getArchivedSales = [
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
          { clientName: { [Op.iLike]: `%${search}%` } },
          { projectName: { [Op.iLike]: `%${search}%` } },
          { salesPerson: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Get archived sales only
      const { count, rows: archivedSales } = await Sale.findAndCountAll({
        where: whereConditions,
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset),
        paranoid: false // Include soft deleted records
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        message: 'Archived sales retrieved successfully',
        data: archivedSales,
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
      console.error('Get archived sales error:', error);
      res.status(500).json({
        message: 'Server error while retrieving archived sales',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Restore archived sale (undo soft delete)
exports.restoreSale = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the soft-deleted sale
    const sale = await Sale.findByPk(id, { paranoid: false });
    
    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found',
        code: 'SALE_NOT_FOUND'
      });
    }

    if (!sale.deleted_at) {
      return res.status(400).json({
        message: 'Sale is not archived',
        code: 'SALE_NOT_ARCHIVED'
      });
    }

    // Restore the sale
    await sale.restore();

    console.log(`✅ Sale restored: ${sale.clientName} - ${sale.projectName} by ${req.user.name}`);

    res.json({
      message: 'Sale restored successfully',
      data: sale
    });

  } catch (error) {
    console.error('Restore sale error:', error);
    res.status(500).json({
      message: 'Server error while restoring sale',
      code: 'SERVER_ERROR'
    });
  }
};

// Permanently delete sale (hard delete)
exports.permanentDeleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the soft-deleted sale
    const sale = await Sale.findByPk(id, { paranoid: false });
    
    if (!sale) {
      return res.status(404).json({
        message: 'Sale not found',
        code: 'SALE_NOT_FOUND'
      });
    }

    if (!sale.deleted_at) {
      return res.status(400).json({
        message: 'Sale must be archived before permanent deletion',
        code: 'SALE_NOT_ARCHIVED'
      });
    }

    const saleName = `${sale.clientName} - ${sale.projectName}`;
    
    // Permanently delete
    await sale.destroy({ force: true });

    console.log(`⚠️ Sale permanently deleted: ${saleName} by ${req.user.name}`);

    res.json({
      message: 'Sale permanently deleted'
    });

  } catch (error) {
    console.error('Permanent delete sale error:', error);
    res.status(500).json({
      message: 'Server error while permanently deleting sale',
      code: 'SERVER_ERROR'
    });
  }
};

