const { Developer } = require('../../models/index.js');
const { Op } = require('sequelize');

// @route   GET /api/developers
// @desc    Get all developers with pagination and filtering
// @access  Private (view_developers permission)
exports.getAllDevelopers = async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '', status = '', specialization = '' } = req.query;
    
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
    
    const { count, rows: developers } = await Developer.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: developers,
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
};

// @route   POST /api/developers
// @desc    Create new developer
// @access  Private (manage_developers permission)
exports.createDeveloper = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      location,
      address, // frontend sends address instead of location
      specialization,
      established,
      description,
      website,
      license_number,
      license, // frontend sends license instead of license_number
      status,
      projectsCount,
      rating,
      contactPerson // frontend sends this but we don't store it
    } = req.body;
    
    // Map frontend fields to backend fields
    const developerLocation = location || address;
    const developerLicenseNumber = license_number || license;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم المطور مطلوب'
      });
    }
    
    // Check if developer with same license number exists
    if (developerLicenseNumber) {
      const existingDeveloper = await Developer.findOne({ 
        where: { license_number: developerLicenseNumber } 
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
      email: email || null,
      phone: phone || null,
      location: developerLocation || null,
      specialization: specialization || null,
      established: established ? parseInt(established) : null,
      description: description || null,
      website: website || null,
      license_number: developerLicenseNumber || null,
      projects_count: projectsCount ? parseInt(projectsCount) : 0,
      rating: rating ? parseFloat(rating) : null,
      status: status || 'active'
    });
    
    res.status(201).json({
      success: true,
      data: newDeveloper,
      message: 'تم إنشاء المطور بنجاح'
    });
    
  } catch (error) {
    console.error('Error creating developer:', error);
    console.error('Request body:', req.body);
    
    // Handle specific database errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'بيانات المطور غير صحيحة',
        details: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'مطور آخر مسجل بنفس البيانات'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المطور',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   GET /api/developers/:id
// @desc    Get developer by ID
// @access  Private (view_developers permission)
exports.getDeveloperById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const developer = await Developer.findByPk(id);
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'المطور غير موجود'
      });
    }
    
    res.json({
      success: true,
      data: developer
    });
  } catch (error) {
    console.error('Error fetching developer:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب بيانات المطور'
    });
  }
};

// @route   PUT /api/developers/:id
// @desc    Update developer
// @access  Private (manage_developers permission)
exports.updateDeveloper = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const developer = await Developer.findByPk(id);
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'المطور غير موجود'
      });
    }
    
    // Check if license number is being updated and if it conflicts
    if (updateData.license_number && updateData.license_number !== developer.license_number) {
      const existingDeveloper = await Developer.findOne({ 
        where: { 
          license_number: updateData.license_number,
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
    await developer.update(updateData);
    
    res.json({
      success: true,
      data: developer,
      message: 'تم تحديث بيانات المطور بنجاح'
    });
  } catch (error) {
    console.error('Error updating developer:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث بيانات المطور'
    });
  }
};

// @route   DELETE /api/developers/:id
// @desc    Soft delete developer (archive)
// @access  Private (manage_developers permission)
exports.deleteDeveloper = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // User ID from JWT token
    const userName = req.user?.name || req.user?.username || 'مستخدم غير معرف';
    
    const developer = await Developer.findByPk(id);
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: 'المطور غير موجود'
      });
    }
    
    // Update with deleted_by info before soft delete
    await developer.update({
      deleted_by: userId,
      // Add user info to description for easier tracking
      description: developer.description ? 
        `${developer.description}\n[DELETED BY: ${userName} on ${new Date().toISOString()}]` : 
        `[DELETED BY: ${userName} on ${new Date().toISOString()}]`
    });
    
    // Soft delete (archive)
    await developer.destroy();
    
    console.log(`🗑️ Developer archived: ${developer.name} by ${userName} (ID: ${userId})`);
    
    res.json({
      success: true,
      message: 'تم أرشفة المطور بنجاح'
    });
  } catch (error) {
    console.error('Error archiving developer:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء أرشفة المطور'
    });
  }
};








