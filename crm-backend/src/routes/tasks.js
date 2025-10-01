const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authMiddleware, requirePermission, requireTaskPermission } = require('../middleware/simple-auth');

// Apply authentication to all routes
router.use(authMiddleware);

// @route   GET /api/tasks
// @desc    Get all tasks with pagination and filtering
// @access  Private (view_tasks permission)
router.get('/', requirePermission('view_tasks'), taskController.getAllTasks);

// @route   GET /api/tasks/my
// @desc    Get current user's tasks
// @access  Private
router.get('/my', taskController.getMyTasks);

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private (view_tasks permission)
router.get('/stats', requirePermission('view_tasks'), taskController.getTaskStats);

// @route   GET /api/tasks/archive
// @desc    Get archived tasks
// @access  Private (view_tasks permission)
router.get('/archive', requirePermission('view_tasks'), taskController.getArchivedTasks);

// @route   GET /api/tasks/:id
// @desc    Get single task by ID
// @access  Private (view_tasks permission)
router.get('/:id', requirePermission('view_tasks'), taskController.getTaskById);

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private (manage_tasks permission)
router.post('/', requirePermission('manage_tasks'), taskController.createTask);

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private (manage_tasks permission or edit_own_tasks with ownership)
router.put('/:id', requireTaskPermission('edit_own_tasks'), taskController.updateTask);

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private (manage_tasks permission)
router.delete('/:id', requirePermission('manage_tasks'), taskController.deleteTask);

// @route   DELETE /api/tasks/archive/all
// @desc    Permanently delete all archived tasks
// @access  Private (manage_tasks permission)
router.delete('/archive/all', requirePermission('manage_tasks'), taskController.permanentDeleteAllTasks);

module.exports = router;


