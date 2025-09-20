const { User } = require('../../models');
const { 
  generateToken, 
  hashPassword, 
  comparePassword 
} = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Register new user
exports.register = [
  // Validation rules
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('role')
    .isIn(['admin', 'sales_manager', 'sales_agent', 'marketing_specialist', 'customer_service'])
    .withMessage('Invalid role specified'),
  
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, name, role, department, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User already exists with this email address.',
          code: 'USER_EXISTS'
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        role: role || 'sales_agent',
        department: department || 'Sales',
        phone: phone || '',
        status: 'active'
      });

      // Generate token
      const token = generateToken(user.id, user.email, user.role);

      // Return user (without password) and token
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt
      };

      console.log(`✅ New user registered: ${user.email} (${user.role})`);

      res.status(201).json({
        message: 'User created successfully',
        user: userResponse,
        token,
        expiresIn: '7d'
      });

    } catch (error) {
      console.error('Registration error:', error);
      
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
        message: 'Server error during registration.',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Login user
exports.login = [
  // Validation rules
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .exists()
    .withMessage('Password is required'),
  
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ 
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if account is active
      if (user.status !== 'active') {
        return res.status(401).json({ 
          message: 'Account is inactive. Contact administrator.',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate token
      const token = generateToken(user.id, user.email, user.role);

      // Return user (without password) and token
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      console.log(`✅ User logged in: ${user.email} (${user.role})`);

      res.json({
        message: 'Login successful',
        user: userResponse,
        token,
        expiresIn: '7d'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        message: 'Server error during login.',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ 
      user,
      permissions: getUserPermissions(user.role)
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching user data.',
      code: 'SERVER_ERROR'
    });
  }
};

// Update user profile
exports.updateProfile = [
  // Validation rules
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Department must be at least 2 characters long'),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, phone, department } = req.body;
      const userId = req.user.id;

      // Update user
      const [updatedRowsCount] = await User.update(
        { name, phone, department },
        { 
          where: { id: userId },
          returning: true
        }
      );

      if (updatedRowsCount === 0) {
        return res.status(404).json({ 
          message: 'User not found.',
          code: 'USER_NOT_FOUND'
        });
      }

      // Get updated user
      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      console.log(`✅ User profile updated: ${updatedUser.email}`);

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        message: 'Server error while updating profile.',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Change password
exports.changePassword = [
  body('currentPassword')
    .exists()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user with password
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ 
          message: 'User not found.',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ 
          message: 'Current password is incorrect.',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await User.update(
        { password: hashedNewPassword },
        { where: { id: userId } }
      );

      console.log(`✅ Password changed for user: ${user.email}`);

      res.json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        message: 'Server error while changing password.',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Logout (for token blacklisting in future)
exports.logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just send a success response
    console.log(`✅ User logged out: ${req.user.email}`);
    
    res.json({ 
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Server error during logout.',
      code: 'SERVER_ERROR'
    });
  }
};

// Helper function to get user permissions based on role
const getUserPermissions = (role) => {
  const permissions = {
    admin: [
      'all_permissions'
    ],
    sales_manager: [
      'manage_clients', 'manage_leads', 'manage_sales', 'view_reports', 
      'manage_projects', 'view_users', 'manage_tasks', 'view_analytics'
    ],
    sales_agent: [
      'view_clients', 'manage_clients', 'view_leads', 'manage_leads', 
      'view_sales', 'create_sales', 'view_projects', 'manage_tasks'
    ],
    marketing_specialist: [
      'view_leads', 'manage_leads', 'view_analytics', 'view_projects', 'manage_tasks'
    ],
    customer_service: [
      'view_clients', 'view_leads', 'view_projects', 'manage_tasks'
    ]
  };
  
  return permissions[role] || [];
};

