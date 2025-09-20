const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authMiddleware, requirePermission } = require('../middleware/simple-auth');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/sales
// @desc    Get all sales with pagination and filtering
// @access  Private (view_sales permission)
router.get('/', requirePermission('view_sales'), saleController.getAllSales);

// @route   GET /api/sales/stats
// @desc    Get sales statistics
// @access  Private (view_sales permission)
router.get('/stats', requirePermission('view_sales'), saleController.getSalesStats);

// @route   GET /api/sales/archive
// @desc    Get archived sales
// @access  Private (view_sales permission)
router.get('/archive', requirePermission('view_sales'), saleController.getArchivedSales);

// @route   GET /api/sales/:id
// @desc    Get single sale by ID
// @access  Private (view_sales permission)
router.get('/:id', requirePermission('view_sales'), saleController.getSaleById);

// @route   POST /api/sales
// @desc    Create new sale
// @access  Private (create_sales permission)
router.post('/', requirePermission('create_sales'), saleController.createSale);

// @route   PUT /api/sales/:id
// @desc    Update sale
// @access  Private (manage_sales permission)
router.put('/:id', requirePermission('manage_sales'), saleController.updateSale);

// @route   DELETE /api/sales/:id
// @desc    Delete sale (soft delete - archive)
// @access  Private (manage_sales permission)
router.delete('/:id', requirePermission('manage_sales'), saleController.deleteSale);

// @route   PATCH /api/sales/:id/restore
// @desc    Restore archived sale
// @access  Private (manage_sales permission)
router.patch('/:id/restore', requirePermission('manage_sales'), saleController.restoreSale);

// @route   DELETE /api/sales/:id/permanent
// @desc    Permanently delete sale
// @access  Private (manage_sales permission)
router.delete('/:id/permanent', requirePermission('manage_sales'), saleController.permanentDeleteSale);

module.exports = router;

