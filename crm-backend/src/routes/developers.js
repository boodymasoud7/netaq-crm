const express = require('express');
const router = express.Router();
const { authMiddleware, requirePermission } = require('../middleware/auth');
const {
  getAllDevelopers,
  createDeveloper,
  getDeveloperById,
  updateDeveloper,
  deleteDeveloper
} = require('../controllers/developerController');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/developers
// @desc    Get all developers with pagination and filtering
// @access  Private (view_developers permission)
router.get('/', requirePermission('view_developers'), getAllDevelopers);

// @route   POST /api/developers
// @desc    Create new developer
// @access  Private (manage_developers permission)
router.post('/', requirePermission('manage_developers'), createDeveloper);

// @route   GET /api/developers/:id
// @desc    Get developer by ID
// @access  Private (view_developers permission)
router.get('/:id', requirePermission('view_developers'), getDeveloperById);

// @route   PUT /api/developers/:id
// @desc    Update developer
// @access  Private (manage_developers permission)
router.put('/:id', requirePermission('manage_developers'), updateDeveloper);

// @route   DELETE /api/developers/:id
// @desc    Soft delete developer (archive)
// @access  Private (manage_developers permission)
router.delete('/:id', requirePermission('manage_developers'), deleteDeveloper);

module.exports = router;