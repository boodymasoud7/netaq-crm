const { Unit } = require('../../models/index.js');
const { Op } = require('sequelize');

// @route   GET /api/units
// @desc    Get all units with pagination and filtering
// @access  Private (view_units permission)
exports.getAllUnits = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      type = '',
      projectId = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    console.log('🏢 Getting units with filters:', { page, limit, search, status, type, projectId });

    // Build where conditions
    const whereConditions = {};

    // Search in name and description
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { projectName: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by status
    if (status) {
      whereConditions.status = status;
    }

    // Filter by type
    if (type) {
      whereConditions.type = type;
    }

    // Filter by project
    if (projectId) {
      whereConditions.projectId = projectId;
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    const { count, rows: units } = await Unit.findAndCountAll({
      where: whereConditions,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: {
        exclude: ['deleted_at']
      }
    });

    console.log(`📊 Found ${count} units, returning ${units.length} for page ${page}`);

    res.json({
      success: true,
      data: units,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit),
        has_next_page: page < Math.ceil(count / limit),
        has_prev_page: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الوحدات',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   GET /api/units/:id
// @desc    Get unit by ID
// @access  Private (view_units permission)
exports.getUnitById = async (req, res) => {
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
      message: 'حدث خطأ أثناء جلب الوحدة'
    });
  }
};

// @route   POST /api/units
// @desc    Create new unit
// @access  Private (create_units permission)
exports.createUnit = async (req, res) => {
  try {
    const {
      name,
      projectId,
      projectName,
      type,
      area,
      bedrooms,
      bathrooms,
      floor,
      price,
      status = 'available',
      description,
      amenities
    } = req.body;

    console.log('🏗️ Creating unit:', { name, projectId, type });

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم الوحدة مطلوب'
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المشروع مطلوب'
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'نوع الوحدة مطلوب'
      });
    }

    if (!area || area <= 0) {
      return res.status(400).json({
        success: false,
        message: 'مساحة الوحدة مطلوبة ويجب أن تكون أكبر من صفر'
      });
    }

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'سعر الوحدة مطلوب ويجب أن يكون أكبر من صفر'
      });
    }

    // Create unit
    const newUnit = await Unit.create({
      name,
      projectId: parseInt(projectId),
      projectName,
      type,
      area: parseFloat(area),
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      floor: floor ? parseInt(floor) : null,
      price: parseFloat(price),
      status,
      description,
      amenities: amenities || []
    });

    console.log('✅ Unit created successfully:', newUnit.id);

    res.status(201).json({
      success: true,
      data: newUnit,
      message: 'تم إنشاء الوحدة بنجاح'
    });

  } catch (error) {
    console.error('Error creating unit:', error);
    console.error('Request body:', req.body);

    // Handle specific database errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'بيانات الوحدة غير صحيحة',
        details: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الوحدة',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   PUT /api/units/:id
// @desc    Update unit
// @access  Private (edit_units permission)
exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('📝 Updating unit:', id, updateData);

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'الوحدة غير موجودة'
      });
    }

    // Update unit
    await unit.update(updateData);

    console.log('✅ Unit updated successfully:', unit.id);

    res.json({
      success: true,
      data: unit,
      message: 'تم تحديث الوحدة بنجاح'
    });

  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الوحدة'
    });
  }
};

// @route   DELETE /api/units/:id
// @desc    Delete unit
// @access  Private (delete_units permission)
exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting unit:', id);

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'الوحدة غير موجودة'
      });
    }

    // Soft delete the unit
    await unit.destroy();

    console.log('✅ Unit deleted successfully:', id);

    res.json({
      success: true,
      message: 'تم حذف الوحدة بنجاح'
    });

  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الوحدة'
    });
  }
};








