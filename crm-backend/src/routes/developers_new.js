const express = require('express');
const router = express.Router();
const { authMiddleware, requirePermission } = require('../middleware/auth');
const { Developer, User } = require('../../models');
const { Op } = require('sequelize');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/developers
// @desc    Get all developers with pagination and filtering
// @access  Private (view_developers permission)
router.get('/', requirePermission('view_developers'), async (req, res) => {
  try {
    const { page = 1, limit = 10000, search = '', status = '', specialization = '' } = req.query;
    
    // Build where conditions
    const whereConditions = {};
    
    // Filter by search term
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
        { specialization: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Filter by status
    if (status) {
      whereConditions.status = status;
    }
    
    // Filter by specialization
    if (specialization) {
      whereConditions.specialization = { [Op.iLike]: `%${specialization}%` };
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    console.log('🔍 Developers query conditions:', whereConditions)
    
    // Explicitly exclude soft-deleted developers
    whereConditions.deleted_at = null;
    
    const { count, rows: developers } = await Developer.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
      // No need to specify paranoid: true since it's default for paranoid models
    });
    
    console.log(`📊 Found ${count} developers (excluding soft-deleted)`)
    console.log('👥 Developers data:', developers.map(d => ({ id: d.id, name: d.name, deleted_at: d.deleted_at })))
    
    // Map backend fields to frontend expected fields
    const mappedDevelopers = developers.map(dev => ({
      ...dev.toJSON(),
      contactPerson: dev.email, // Frontend expects contactPerson, map from email
      address: dev.location     // Frontend expects address, map from location
    }));
    
    res.json({
      success: true,
      data: mappedDevelopers,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching developers:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات المطورين'
    });
  }
});

// @route   POST /api/developers
// @desc    Create new developer
// @access  Private (manage_developers permission)
router.post('/', requirePermission('manage_developers'), async (req, res) => {
  try {
    const {
      name,
      email,
      contactPerson, // Frontend sends this
      phone,
      location,
      address, // Frontend sends this
      specialization,
      established,
      description,
      website,
      license_number
    } = req.body;
    
    // Map frontend fields to backend fields
    const backendEmail = email || contactPerson;
    const backendLocation = location || address;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم المطور مطلوب'
      });
    }
    
    // Check if developer with same license number exists (only if license_number is not empty)
    if (license_number && license_number.trim() !== '') {
      const existingDeveloper = await Developer.findOne({ 
        where: { license_number: license_number } 
      });
      if (existingDeveloper) {
        return res.status(400).json({
          success: false,
          message: 'مطور آخر مسجل بنفس رقم الترخيص'
        });
      }
    }
    
    // Create new developer in database
    const newDeveloper = await Developer.create({
      name,
      email: backendEmail,
      phone,
      location: backendLocation,
      specialization,
      established: established ? parseInt(established) : null,
      description,
      website,
      license_number: license_number && license_number.trim() !== '' ? license_number : null,
      projects_count: 0,
      rating: null,
      status: 'active'
    });
    
    // Map backend fields to frontend expected fields
    const mappedDeveloper = {
      ...newDeveloper.toJSON(),
      contactPerson: newDeveloper.email,
      address: newDeveloper.location
    };
    
    res.status(201).json({
      success: true,
      data: mappedDeveloper,
      message: 'تم إنشاء المطور بنجاح'
    });
    
  } catch (error) {
    console.error('Error creating developer:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المطور'
    });
  }
});

// @route   GET /api/developers/archive
// @desc    Get archived developers
// @access  Private (view_developers permission)
router.get('/archive', requirePermission('view_developers'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows: archivedDevelopers } = await Developer.findAndCountAll({
      where: {
        deleted_at: { [Op.ne]: null } // Only soft deleted records
      },
      include: [{
        model: User,
        as: 'deletedByUser',
        attributes: ['id', 'name', 'username', 'email'],
        required: false
      }],
      order: [['deleted_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      paranoid: false // Include soft deleted records
    });
    
    res.json({
      message: 'Archived developers retrieved successfully',
      data: archivedDevelopers,
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
    console.error('Error fetching archived developers:', error);
    res.status(500).json({
      message: 'Server error while retrieving archived developers',
      code: 'SERVER_ERROR'
    });
  }
});

// @route   GET /api/developers/:id
// @desc    Get developer by ID
// @access  Private (view_developers permission)
router.get('/:id', requirePermission('view_developers'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const developer = await Developer.findByPk(id);
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'المطور غير موجود'
      });
    }
    
    // Map backend fields to frontend expected fields
    const mappedDeveloper = {
      ...developer.toJSON(),
      contactPerson: developer.email,
      address: developer.location
    };
    
    res.json({
      success: true,
      data: mappedDeveloper
    });
  } catch (error) {
    console.error('Error fetching developer:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات المطور'
    });
  }
});

// @route   PUT /api/developers/:id
// @desc    Update developer
// @access  Private (manage_developers permission)
router.put('/:id', requirePermission('manage_developers'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Map frontend fields to backend fields
    const backendUpdateData = {
      ...updateData,
      email: updateData.email || updateData.contactPerson,
      location: updateData.location || updateData.address
    };
    
    // Remove frontend-only fields
    delete backendUpdateData.contactPerson;
    delete backendUpdateData.address;
    
    const developer = await Developer.findByPk(id);
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'المطور غير موجود'
      });
    }
    
    // Check if license number is being updated and if it conflicts
    if (backendUpdateData.license_number && backendUpdateData.license_number !== developer.license_number) {
      const existingDeveloper = await Developer.findOne({ 
        where: { 
          license_number: backendUpdateData.license_number,
          id: { [Op.ne]: id }
        } 
      });
      if (existingDeveloper) {
        return res.status(400).json({
          success: false,
          message: 'مطور آخر مسجل بنفس رقم الترخيص'
        });
      }
    }
    
    // Update developer
    await developer.update(backendUpdateData);
    
    // Map backend fields to frontend expected fields
    const mappedDeveloper = {
      ...developer.toJSON(),
      contactPerson: developer.email,
      address: developer.location
    };
    
    res.json({
      success: true,
      data: mappedDeveloper,
      message: 'تم تحديث بيانات المطور بنجاح'
    });
  } catch (error) {
    console.error('Error updating developer:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث بيانات المطور'
    });
  }
});

// @route   DELETE /api/developers/:id
// @desc    Archive developer (set status to archived)
// @access  Private (manage_developers permission)
router.delete('/:id', requirePermission('manage_developers'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const developer = await Developer.findByPk(id);
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'المطور غير موجود'
      });
    }
    
    console.log(`🗑️ Soft deleting developer: ${developer.name} (ID: ${id})`)
    
    // Save who deleted this developer before soft deleting
    await developer.update({ 
      deleted_by: req.user?.id || null,
      description: `${developer.description || ''} - تم الحذف بواسطة ${req.user?.name || 'المستخدم'} في ${new Date().toLocaleString('ar-EG')}`
    });
    
    // Perform soft delete (sets deleted_at timestamp)
    await developer.destroy();
    
    console.log(`✅ Developer soft deleted successfully: ${developer.name}`)
    
    res.json({
      success: true,
      message: 'تم حذف المطور بنجاح'
    });
  } catch (error) {
    console.error('Error archiving developer:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء أرشفة المطور'
    });
  }
});

// @route   PATCH /api/developers/:id/restore
// @desc    Restore archived developer
// @access  Private (manage_developers permission)
router.patch('/:id/restore', requirePermission('manage_developers'), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Attempting to restore developer with ID: ${id}`);
    
    // Find developer including soft-deleted ones
    const developer = await Developer.findByPk(id, { paranoid: false });
    if (!developer) {
      console.log(`❌ Developer ${id} not found in database`);
      return res.status(404).json({
        success: false,
        message: 'المطور غير موجود'
      });
    }
    
    // Check if developer is actually deleted
    if (!developer.deleted_at) {
      console.log(`⚠️ Developer ${id} is not deleted, cannot restore`);
      return res.status(400).json({
        success: false,
        message: 'المطور غير محذوف'
      });
    }
    
    console.log(`🔄 Restoring developer: ${developer.name} (ID: ${id})`);
    
    // Restore developer by calling the restore method
    await developer.restore();
    
    console.log(`✅ Developer ${developer.name} restored successfully`);
    
    res.json({
      success: true,
      message: 'تم استعادة المطور بنجاح',
      data: developer
    });
  } catch (error) {
    console.error('Error restoring developer:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استعادة المطور',
      error: error.message
    });
  }
});

// @route   DELETE /api/developers/:id/permanent
// @desc    Permanently delete developer
// @access  Private (manage_developers permission)
router.delete('/:id/permanent', requirePermission('manage_developers'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const developer = await Developer.findByPk(id);
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'المطور غير موجود'
      });
    }
    
    // Permanent delete
    await developer.destroy();
    
    res.json({
      success: true,
      message: 'تم حذف المطور نهائياً'
    });
  } catch (error) {
    console.error('Error permanently deleting developer:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المطور نهائياً'
    });
  }
});

// @route   DELETE /api/developers/archive/all
// @desc    Permanently delete all archived developers
// @access  Private (manage_developers permission)
router.delete('/archive/all', requirePermission('manage_developers'), async (req, res) => {
  try {
    // Find all soft-deleted developers
    const archivedDevelopers = await Developer.findAll({ 
      paranoid: false,
      where: {
        deleted_at: {
          [Op.not]: null
        }
      }
    });

    if (archivedDevelopers.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No archived developers found to delete',
        deletedCount: 0
      });
    }

    const count = archivedDevelopers.length;
    
    // Permanently delete all archived developers
    await Developer.destroy({ 
      force: true,
      paranoid: false,
      where: {
        deleted_at: {
          [Op.not]: null
        }
      }
    });

    console.log(`⚠️ ${count} developers permanently deleted by ${req.user?.name || 'system'}`);

    res.json({
      success: true,
      message: `${count} archived developers permanently deleted`,
      deletedCount: count
    });

  } catch (error) {
    console.error('Permanent delete all developers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while permanently deleting all developers',
      error: error.message
    });
  }
});

module.exports = router;






