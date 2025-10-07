const express = require('express');
const router = express.Router();
const { authMiddleware, requirePermission } = require('../middleware/auth');
const { Unit } = require('../../models');
const { Op } = require('sequelize');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/units
// @desc    Get all units with pagination and filtering
// @access  Private (view_units permission)
router.get('/', requirePermission('view_units'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', projectId = '' } = req.query;
    
    // Build where conditions
    const whereConditions = {};
    
    // Filter by search term
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { type: { [Op.iLike]: `%${search}%` } },
        { projectName: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Filter by status
    if (status) {
      whereConditions.status = status;
    }
    
    // Filter by project ID
    if (projectId) {
      whereConditions.projectId = parseInt(projectId);
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    const { count, rows: units } = await Unit.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: units,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات الوحدات'
    });
  }
});

// @route   POST /api/units
// @desc    Create new unit
// @access  Private (manage_units permission)
router.post('/', requirePermission('manage_units'), async (req, res) => {
  try {
    const {
      name,
      type,
      projectId,
      projectName,
      area,
      price,
      status,
      description,
      floor,
      bedrooms,
      bathrooms,
      amenities
    } = req.body;
    
    // Validation
    if (!name || !projectId || !type || !area || !price) {
      return res.status(400).json({
        success: false,
        message: 'الاسم ومعرف المشروع والنوع والمساحة والسعر مطلوبة'
      });
    }
    
    // Create new unit in database
    const newUnit = await Unit.create({
      name,
      type,
      projectId: parseInt(projectId),
      projectName: projectName || '',
      area: parseFloat(area),
      price: parseFloat(price),
      status: status || 'available',
      description: description || '',
      floor: floor ? parseInt(floor) : null,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      amenities: amenities || []
    });
    
    res.status(201).json({
      success: true,
      data: newUnit,
      message: 'تم إنشاء الوحدة بنجاح'
    });
    
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الوحدة'
    });
  }
});

// @route   GET /api/units/archive
// @desc    Get archived units
// @access  Private (view_units permission)
router.get('/archive', requirePermission('view_units'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows: archivedUnits } = await Unit.findAndCountAll({
      where: {
        deleted_at: { [Op.ne]: null }
      },
      paranoid: false, // Include soft-deleted records
      order: [['deleted_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      message: 'Archived units retrieved successfully',
      data: archivedUnits,
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
    console.error('Error fetching archived units:', error);
    res.status(500).json({
      message: 'Server error while retrieving archived units',
      code: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/units/:id
// @desc    Get unit by ID
// @access  Private (view_units permission)
router.get('/:id', requirePermission('view_units'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'الوحدة غير موجودة'
      });
    }
    
    res.json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات الوحدة'
    });
  }
});

// @route   PUT /api/units/:id
// @desc    Update unit
// @access  Private (manage_units permission)
router.put('/:id', requirePermission('manage_units'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'الوحدة غير موجودة'
      });
    }
    
    // Update unit
    await unit.update(updateData);
    
    res.json({
      success: true,
      data: unit,
      message: 'تم تحديث بيانات الوحدة بنجاح'
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث بيانات الوحدة'
    });
  }
});

// @route   DELETE /api/units/:id
// @desc    Soft delete unit (archive)
// @access  Private (manage_units permission)
router.delete('/:id', requirePermission('manage_units'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'الوحدة غير موجودة'
      });
    }
    
    // Soft delete (archive)
    await unit.destroy();
    
    res.json({
      success: true,
      message: 'تم أرشفة الوحدة بنجاح'
    });
  } catch (error) {
    console.error('Error archiving unit:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء أرشفة الوحدة'
    });
  }
});

// @route   PATCH /api/units/:id/restore
// @desc    Restore archived unit
// @access  Private (manage_units permission)
router.patch('/:id/restore', requirePermission('manage_units'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const unit = await Unit.findByPk(id, { paranoid: false });
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'الوحدة غير موجودة'
      });
    }
    
    // Restore unit
    await unit.restore();
    
    res.json({
      success: true,
      message: 'تم استعادة الوحدة بنجاح'
    });
  } catch (error) {
    console.error('Error restoring unit:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استعادة الوحدة'
    });
  }
});

// @route   DELETE /api/units/:id/permanent
// @desc    Permanently delete unit
// @access  Private (manage_units permission)
router.delete('/:id/permanent', requirePermission('manage_units'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const unit = await Unit.findByPk(id, { paranoid: false });
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'الوحدة غير موجودة'
      });
    }
    
    // Permanent delete
    await unit.destroy({ force: true });
    
    res.json({
      success: true,
      message: 'تم حذف الوحدة نهائياً'
    });
  } catch (error) {
    console.error('Error permanently deleting unit:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الوحدة نهائياً'
    });
  }
});

module.exports = router;






