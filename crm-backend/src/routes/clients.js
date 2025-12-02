const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authMiddleware, requirePermission } = require('../middleware/simple-auth');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/clients
// @desc    Get all clients with pagination and filtering
// @access  Private (view_clients permission)
router.get('/', requirePermission('view_clients'), clientController.getAllClients);

// @route   GET /api/clients/stats
// @desc    Get client statistics
// @access  Private (view_clients permission)
router.get('/stats', requirePermission('view_clients'), clientController.getClientStats);

// @route   GET /api/clients/archive
// @desc    Get archived clients
// @access  Private (view_clients permission)
router.get('/archive', requirePermission('view_clients'), clientController.getArchivedClients);

// @route   GET /api/clients/check-duplicates
// @desc    Check for duplicate clients by phone or email
// @access  Private (view_clients permission)
router.get('/check-duplicates', requirePermission('view_clients'), clientController.checkDuplicates);

// @route   GET /api/clients/:id
// @desc    Get single client by ID
// @access  Private (view_clients permission)
router.get('/:id', requirePermission('view_clients'), clientController.getClientById);

// @route   POST /api/clients
// @desc    Create new client
// @access  Private (manage_clients permission)
router.post('/', requirePermission('manage_clients'), clientController.createClient);

// @route   PUT /api/clients/:id
// @desc    Update client
// @access  Private (manage_clients permission)
router.put('/:id', requirePermission('manage_clients'), clientController.updateClient);

// @route   DELETE /api/clients/:id
// @desc    Delete client (soft delete - archive)
// @access  Private (manage_clients permission)
router.delete('/:id', requirePermission('manage_clients'), clientController.deleteClient);

// @route   PATCH /api/clients/:id/restore
// @desc    Restore archived client
// @access  Private (manage_clients permission)
router.patch('/:id/restore', requirePermission('manage_clients'), clientController.restoreClient);

// @route   DELETE /api/clients/:id/permanent
// @desc    Permanently delete client
// @access  Private (manage_clients permission)
router.delete('/:id/permanent', requirePermission('manage_clients'), clientController.permanentDeleteClient);

// @route   DELETE /api/clients/archive/all
// @desc    Permanently delete all archived clients
// @access  Private (manage_clients permission)
router.delete('/archive/all', requirePermission('manage_clients'), clientController.permanentDeleteAllClients);

module.exports = router;