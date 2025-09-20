const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../../models');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'crm_super_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT Token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { 
      id: userId, 
      email, 
      role,
      timestamp: Date.now()
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Hash Password
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare Password
const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    console.log('🔐 Auth middleware - URL:', req.url);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth failed: No token provided');
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      console.log('❌ Auth failed: Invalid token format');
      return res.status(401).json({ 
        message: 'Access denied. Invalid token format.',
        code: 'INVALID_FORMAT'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    console.log('✅ Token decoded for user:', decoded.email);
    
    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ 
        message: 'Account is inactive. Contact administrator.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error in authentication.',
      code: 'SERVER_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Permission Middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    // Admin has all permissions
    if (userRole === 'admin') {
      return next();
    }
    
    // Define role permissions (simplified version)
    const rolePermissions = {
      sales_manager: [
        'manage_clients', 'manage_leads', 'convert_leads', 'manage_sales', 'view_reports', 
        'manage_projects', 'view_users', 'manage_users', 'manage_tasks', 'view_developers', 
        'manage_developers', 'view_units', 'create_units', 'edit_units', 'delete_units', 'view_tasks', 
        'view_interactions', 'manage_interactions', 'view_reminders', 'create_reminders',
        'edit_reminders', 'delete_reminders'
      ],
      sales: [
        'view_clients', 'manage_clients', 'view_leads', 'manage_leads', 'convert_leads',
        'view_sales', 'create_sales', 'view_projects', 'view_users',
        'view_developers', 'manage_developers', 'view_units', 'create_units', 'edit_units', 'delete_units', 'view_tasks', 'edit_own_tasks',
        'view_interactions', 'manage_interactions', 'view_reminders', 'create_reminders',
        'edit_reminders', 'delete_reminders'
      ],
      sales_agent: [
        'view_clients', 'manage_clients', 'view_leads', 'manage_leads', 'convert_leads',
        'view_sales', 'create_sales', 'view_projects', 'view_users',
        'view_developers', 'manage_developers', 'view_units', 'create_units', 'edit_units', 'delete_units', 'view_tasks', 'edit_own_tasks',
        'view_interactions', 'manage_interactions', 'view_reminders', 'create_reminders',
        'edit_reminders', 'delete_reminders'
      ],
      employee: [
        'view_clients', 'view_leads', 'view_sales', 'view_projects'
      ],
      marketing_specialist: [
        'view_leads', 'manage_leads', 'view_analytics', 'view_projects'
      ],
      customer_service: [
        'view_clients', 'view_leads', 'view_projects', 'manage_tasks'
      ]
    };
    
    const userPermissions = rolePermissions[userRole] || [];
    
    if (userPermissions.includes(permission)) {
      return next();
    }
    
    // Admin has all permissions (fallback)
    if (userRole === 'admin') {
      return next();
    }
    
    res.status(403).json({ 
      message: 'Insufficient permissions for this action.',
      code: 'INSUFFICIENT_PERMISSIONS',
      required: permission,
      userRole: userRole
    });
  };
};

// Task ownership middleware
const requireTaskPermission = (permission) => {
  return async (req, res, next) => {
    const userRole = req.user.role;
    
    // Admin and sales_manager have full access
    if (userRole === 'admin' || userRole === 'sales_manager') {
      return next();
    }
    
    // Check if user has manage_tasks permission (full access)
    const rolePermissions = {
      sales_manager: [
        'manage_clients', 'manage_leads', 'convert_leads', 'manage_sales', 'view_reports', 
        'manage_projects', 'view_users', 'manage_users', 'manage_tasks', 'view_developers', 
        'manage_developers', 'view_units', 'create_units', 'edit_units', 'delete_units', 'view_tasks', 
        'view_interactions', 'manage_interactions', 'view_reminders', 'create_reminders',
        'edit_reminders', 'delete_reminders'
      ],
      sales: [
        'view_clients', 'manage_clients', 'view_leads', 'manage_leads', 'convert_leads',
        'view_sales', 'create_sales', 'view_projects', 'view_users',
        'view_developers', 'manage_developers', 'view_units', 'create_units', 'edit_units', 'delete_units', 'view_tasks', 'edit_own_tasks',
        'view_interactions', 'manage_interactions', 'view_reminders', 'create_reminders',
        'edit_reminders', 'delete_reminders'
      ],
      sales_agent: [
        'view_clients', 'manage_clients', 'view_leads', 'manage_leads', 'convert_leads',
        'view_sales', 'create_sales', 'view_projects', 'view_users',
        'view_developers', 'manage_developers', 'view_units', 'create_units', 'edit_units', 'delete_units', 'view_tasks', 'edit_own_tasks',
        'view_interactions', 'manage_interactions', 'view_reminders', 'create_reminders',
        'edit_reminders', 'delete_reminders'
      ],
      employee: [
        'view_clients', 'view_leads', 'view_sales', 'view_projects'
      ],
      marketing_specialist: [
        'view_leads', 'manage_leads', 'view_analytics', 'view_projects'
      ],
      customer_service: [
        'view_clients', 'view_leads', 'view_projects', 'manage_tasks'
      ]
    };
    
    const userPermissions = rolePermissions[userRole] || [];
    
    // If user has manage_tasks permission, allow full access
    if (userPermissions.includes('manage_tasks')) {
      return next();
    }
    
    // If user has edit_own_tasks permission, check ownership
    if (permission === 'edit_own_tasks' && userPermissions.includes('edit_own_tasks')) {
      const { Task } = require('../../models');
      const { id } = req.params;
      
      try {
        const task = await Task.findByPk(id);
        if (!task) {
          return res.status(404).json({
            message: 'Task not found',
            code: 'TASK_NOT_FOUND'
          });
        }
        
        // Check if user is assigned to this task or created it
        if (task.assignedTo === req.user.name || task.createdBy === req.user.id) {
          return next();
        }
        
        return res.status(403).json({
          message: 'You can only edit tasks assigned to you',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        
      } catch (error) {
        console.error('Task permission check error:', error);
        return res.status(500).json({
          message: 'Server error checking task permissions',
          code: 'SERVER_ERROR'
        });
      }
    }
    
    res.status(403).json({ 
      message: 'Insufficient permissions for this action.',
      code: 'INSUFFICIENT_PERMISSIONS',
      required: permission,
      userRole: userRole
    });
  };
};

// Role Middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (roles.includes(req.user.role)) {
      return next();
    }
    
    res.status(403).json({ 
      message: 'Access denied. Insufficient role permissions.',
      code: 'ROLE_DENIED',
      required: roles,
      userRole: req.user.role
    });
  };
};

// Optional Auth Middleware (for public routes that can benefit from user info)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't return error, just continue without user
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  authMiddleware,
  requirePermission,
  requireTaskPermission,
  requireRole,
  optionalAuth
};
