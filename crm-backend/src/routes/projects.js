const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware, requirePermission } = require('../middleware/simple-auth');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/projects
// @desc    Get all projects with pagination and filtering
// @access  Private (view_projects permission)
router.get('/', requirePermission('view_projects'), projectController.getAllProjects);

// @route   GET /api/projects/stats
// @desc    Get project statistics
// @access  Private (view_projects permission)
router.get('/stats', requirePermission('view_projects'), projectController.getProjectStats);

// @route   GET /api/projects/archive
// @desc    Get archived projects
// @access  Private (view_projects permission)
router.get('/archive', requirePermission('view_projects'), projectController.getArchivedProjects);

// @route   GET /api/projects/:id
// @desc    Get single project by ID
// @access  Private (view_projects permission)
router.get('/:id', requirePermission('view_projects'), projectController.getProjectById);

// @route   POST /api/projects
// @desc    Create new project
// @access  Private (manage_projects permission)
router.post('/', requirePermission('manage_projects'), projectController.createProject);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (manage_projects permission)
router.put('/:id', requirePermission('manage_projects'), projectController.updateProject);

// @route   DELETE /api/projects/:id
// @desc    Delete project (soft delete - archive)
// @access  Private (manage_projects permission)
router.delete('/:id', requirePermission('manage_projects'), projectController.deleteProject);

// @route   PATCH /api/projects/:id/restore
// @desc    Restore archived project
// @access  Private (manage_projects permission)
router.patch('/:id/restore', requirePermission('manage_projects'), projectController.restoreProject);

// @route   DELETE /api/projects/:id/permanent
// @desc    Permanently delete project
// @access  Private (manage_projects permission)
router.delete('/:id/permanent', requirePermission('manage_projects'), projectController.permanentDeleteProject);

module.exports = router;

