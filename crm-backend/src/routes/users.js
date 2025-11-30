const express = require('express');
const router = express.Router();
const { authMiddleware, requirePermission } = require('../middleware/simple-auth');
const {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus
} = require('../controllers/userController');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/users
// @desc    Get all users with pagination and filtering
// @access  Private (view_users permission)
router.get('/', requirePermission('view_users'), getAllUsers);

// @route   POST /api/users
// @desc    Create new user
// @access  Private (admin or manage_users permission)
router.post('/', requirePermission('manage_users'), createUser);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (view_users permission)
router.get('/:id', requirePermission('view_users'), getUserById);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (admin or manage_users permission)
router.put('/:id', requirePermission('manage_users'), updateUser);

// @route   PUT /api/users/:id/status
// @desc    Update user status (active/inactive)
// @access  Private (admin or manage_users permission)
router.put('/:id/status', requirePermission('manage_users'), updateUserStatus);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (admin or manage_users permission)
router.delete('/:id', requirePermission('manage_users'), deleteUser);

module.exports = router;