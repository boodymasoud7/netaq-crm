const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authMiddleware, requirePermission } = require('../middleware/simple-auth');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/leads
// @desc    Get all leads with pagination and filtering
// @access  Private (view_leads permission)
router.get('/', requirePermission('view_leads'), leadController.getAllLeads);

// @route   GET /api/leads/stats
// @desc    Get lead statistics
// @access  Private (view_leads permission)
router.get('/stats', requirePermission('view_leads'), leadController.getLeadStats);

// @route   GET /api/leads/archive
// @desc    Get archived leads
// @access  Private (view_leads permission)
router.get('/archive', requirePermission('view_leads'), leadController.getArchivedLeads);

// @route   GET /api/leads/:id
// @desc    Get single lead by ID
// @access  Private (view_leads permission)
router.get('/:id', requirePermission('view_leads'), leadController.getLeadById);

// @route   POST /api/leads
// @desc    Create new lead
// @access  Private (manage_leads permission)
router.post('/', requirePermission('manage_leads'), leadController.createLead);

// @route   PUT /api/leads/:id
// @desc    Update lead
// @access  Private (manage_leads permission)
router.put('/:id', requirePermission('manage_leads'), leadController.updateLead);

// @route   POST /api/leads/:id/convert
// @desc    Convert lead to client
// @access  Private (manage_leads permission)
router.post('/:id/convert', requirePermission('manage_leads'), leadController.convertToClient);

// @route   DELETE /api/leads/:id
// @desc    Delete lead (soft delete - archive)
// @access  Private (manage_leads permission)
router.delete('/:id', requirePermission('manage_leads'), leadController.deleteLead);

// @route   PATCH /api/leads/:id/restore
// @desc    Restore archived lead
// @access  Private (manage_leads permission)
router.patch('/:id/restore', requirePermission('manage_leads'), leadController.restoreLead);

// @route   DELETE /api/leads/:id/permanent
// @desc    Permanently delete lead
// @access  Private (manage_leads permission)
router.delete('/:id/permanent', requirePermission('manage_leads'), leadController.permanentDeleteLead);

// @route   DELETE /api/leads/archive/all
// @desc    Permanently delete all archived leads
// @access  Private (manage_leads permission)
router.delete('/archive/all', requirePermission('manage_leads'), leadController.permanentDeleteAllLeads);

module.exports = router;

