const { User } = require('../../models/index.js');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// @route   GET /api/users
// @desc    Get all users with pagination and filtering
// @access  Private (admin or manage_users permission)
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      search = '', 
      role = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    console.log('👥 Getting users with filters:', { page, limit, search, role, status });

    // Build where conditions
    const whereConditions = {};

    // Search in name, email, and username
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by role
    if (role) {
      whereConditions.role = role;
    }

    // Filter by status
    if (status) {
      whereConditions.status = status;
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      where: whereConditions,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: {
        exclude: ['password', 'deleted_at'] // Don't return password
      }
    });

    console.log(`📊 Found ${count} users, returning ${users.length} for page ${page}`);

    res.json({
      success: true,
      data: users,
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
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المستخدمين',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (admin or manage_users permission)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ['password', 'deleted_at']
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المستخدم'
    });
  }
};

// @route   POST /api/users
// @desc    Create new user
// @access  Private (admin or manage_users permission)
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      password,
      role = 'user',
      status = 'active',
      permissions = []
    } = req.body;

    console.log('👤 Creating user:', { name, email, username, role });

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم مطلوب'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مطلوب'
      });
    }

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم مطلوب'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور مطلوبة ويجب أن تكون 6 أحرف على الأقل'
      });
    }

    // Check if user with same email or username exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    console.log('👤 Creating user with data:', {
      name,
      email,
      username,
      role,
      status,
      permissions: Array.isArray(permissions) ? permissions : []
    });
    
    const newUser = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      role,
      status,
      permissions: Array.isArray(permissions) ? permissions : []
    });

    console.log('✅ User created successfully:', newUser.id);

    // Return user without password
    const userResponse = {
      ...newUser.toJSON(),
      password: undefined
    };

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'تم إنشاء المستخدم بنجاح'
    });

  } catch (error) {
    console.error('❌ Error creating user:', error);
    console.error('📝 Request body:', req.body);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Handle specific database errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'بيانات المستخدم غير صحيحة',
        details: error.errors.map(e => e.message)
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني أو اسم المستخدم مستخدم بالفعل'
      });
    }

    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المستخدم',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (admin or manage_users permission)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log('📝 Updating user:', id, updateData);

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // If password is being updated, hash it
    if (updateData.password) {
      if (updateData.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        });
      }
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    // Check if email or username is being updated and if it conflicts
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email: updateData.email,
          id: { [Op.ne]: id }
        } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني مستخدم بالفعل'
        });
      }
    }

    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await User.findOne({ 
        where: { 
          username: updateData.username,
          id: { [Op.ne]: id }
        } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'اسم المستخدم مستخدم بالفعل'
        });
      }
    }

    // Update user
    await user.update(updateData);

    console.log('✅ User updated successfully:', user.id);

    // Return user without password
    const userResponse = {
      ...user.toJSON(),
      password: undefined
    };

    res.json({
      success: true,
      data: userResponse,
      message: 'تم تحديث المستخدم بنجاح'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المستخدم'
    });
  }
};

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (admin or manage_users permission)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting user:', id);

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Prevent deletion of admin users (optional safety check)
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف مستخدم مدير'
      });
    }

    // Soft delete the user
    await user.destroy();

    console.log('✅ User deleted successfully:', id);

    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المستخدم'
    });
  }
};

