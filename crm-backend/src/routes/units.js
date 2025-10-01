const express = require('express');
const router = express.Router();
const { authMiddleware, requirePermission } = require('../middleware/auth');
const {
  getAllUnits,
  createUnit,
  getUnitById,
  updateUnit,
  deleteUnit
} = require('../controllers/unitController');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/units
// @desc    Get all units with pagination and filtering
// @access  Private (view_units permission)
router.get('/', requirePermission('view_units'), getAllUnits);

// @route   POST /api/units
// @desc    Create new unit
// @access  Private (create_units permission)
router.post('/', requirePermission('create_units'), createUnit);

// @route   GET /api/units/:id
// @desc    Get unit by ID
// @access  Private (view_units permission)
router.get('/:id', requirePermission('view_units'), getUnitById);

// @route   PUT /api/units/:id
// @desc    Update unit
// @access  Private (edit_units permission)
router.put('/:id', requirePermission('edit_units'), updateUnit);

// @route   DELETE /api/units/:id
// @desc    Delete unit
// @access  Private (delete_units permission)
router.delete('/:id', requirePermission('delete_units'), deleteUnit);

module.exports = router;