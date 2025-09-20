const express = require('express');
const router = express.Router();
const { authMiddleware, requirePermission } = require('../middleware/simple-auth');
const { Sale, Project, Task, sequelize } = require('../../models');
const { Op } = require('sequelize');

// Apply authentication to all routes
router.use(authMiddleware);

// Sales Archive Routes
// @route   GET /api/archive/sales
// @desc    Get archived sales with soft delete support
// @access  Private
router.get('/sales', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    // Check if Sale model exists and has deleted_at column
    const tableExists = await Sale.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sales'
      );
    `);
    
    if (!tableExists[0][0].exists) {
      console.log('⚠️ Sales table does not exist');
      return res.json({
        success: true,
        message: 'Archived sales retrieved successfully',
        data: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit),
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }
    
    // Check if deleted_at column exists
    const columnExists = await Sale.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'sales' 
        AND column_name = 'deleted_at'
      );
    `);
    
    if (!columnExists[0][0].exists) {
      console.log('⚠️ Sales table does not have deleted_at column');
      return res.json({
        success: true,
        message: 'Archived sales retrieved successfully',
        data: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit),
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }
    
    // Build where condition for soft deleted sales
    const whereCondition = {};
    
    // Add search functionality
    if (search) {
      whereCondition[Op.or] = [
        { clientName: { [Op.iLike]: `%${search}%` } },
        { projectName: { [Op.iLike]: `%${search}%` } },
        { unitType: { [Op.iLike]: `%${search}%` } },
        { salesPerson: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Add condition to get only soft deleted records
    whereCondition.deleted_at = { [Op.ne]: null };
    
    // Get archived sales from database (soft deleted)
    const { rows: archivedSales, count: totalItems } = await Sale.findAndCountAll({
      where: whereCondition,
      order: [['deleted_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      paranoid: false // Include soft deleted records
    });
    
    // All results are already deleted records
    const deletedSales = archivedSales;
    
    console.log(`📁 Archived sales retrieved: ${deletedSales.length} items`);
    
    res.json({
      success: true,
      message: 'Archived sales retrieved successfully',
      data: deletedSales,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems, // استخدام العدد الصحيح من findAndCountAll
        itemsPerPage: parseInt(limit),
        hasNextPage: (parseInt(page) * parseInt(limit)) < totalItems,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching archived sales:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المبيعات المؤرشفة',
      error: error.message
    });
  }
});

// @route   PATCH /api/archive/sales/:id/restore
// @desc    Restore archived sale with soft delete support
// @access  Private
router.patch('/sales/:id/restore', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the soft deleted sale
    const sale = await Sale.findByPk(id, { paranoid: false });
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'المبيعة غير موجودة'
      });
    }
    
    if (sale.deleted_at === null) {
      return res.status(400).json({
        success: false,
        message: 'المبيعة غير مؤرشفة'
      });
    }
    
    // Restore the sale
    await sale.restore();
    
    console.log(`♻️ Sale restored: ${sale.id} - ${sale.clientName}`);
    
    res.json({
      success: true,
      message: 'تم استعادة المبيعة بنجاح',
      data: sale
    });
  } catch (error) {
    console.error('Error restoring sale:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استعادة المبيعة'
    });
  }
});

// @route   DELETE /api/archive/sales/:id/permanent
// @desc    Permanently delete sale with soft delete support
// @access  Private
router.delete('/sales/:id/permanent', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the soft deleted sale
    const sale = await Sale.findByPk(id, { paranoid: false });
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'المبيعة غير موجودة'
      });
    }
    
    if (sale.deleted_at === null) {
      return res.status(400).json({
        success: false,
        message: 'المبيعة غير مؤرشفة - لا يمكن حذفها نهائياً'
      });
    }
    
    // Permanently delete the sale
    await sale.destroy({ force: true });
    
    console.log(`🗑️ Sale permanently deleted: ${sale.id} - ${sale.clientName}`);
    
    res.json({
      success: true,
      message: 'تم حذف المبيعة نهائياً'
    });
  } catch (error) {
    console.error('Error permanently deleting sale:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المبيعة نهائياً'
    });
  }
});

// Projects Archive Routes
// @route   GET /api/archive/projects
// @desc    Get archived projects with soft delete support
// @access  Private
router.get('/projects', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    // Check if Project table exists
    const tableExists = await Project.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
      );
    `);
    
    if (!tableExists[0][0].exists) {
      console.log('⚠️ Projects table does not exist');
      return res.json({
        success: true,
        message: 'Archived projects retrieved successfully',
        data: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit),
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }
    
    // Check if deleted_at column exists
    const columnExists = await Project.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'deleted_at'
      );
    `);
    
    if (!columnExists[0][0].exists) {
      console.log('⚠️ Projects table does not have deleted_at column');
      return res.json({
        success: true,
        message: 'Archived projects retrieved successfully',
        data: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit),
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }
    
    // Build where condition for soft deleted projects
    const whereCondition = {};
    
    // Add search functionality
    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
        { developer: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Add condition to get only soft deleted records
    whereCondition.deleted_at = { [Op.ne]: null };
    
    // Get archived projects from database (soft deleted)
    const { rows: archivedProjects, count: totalItems } = await Project.findAndCountAll({
      where: whereCondition,
      order: [['deleted_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      paranoid: false // Include soft deleted records
    });
    
    // All results are already deleted records
    const deletedProjects = archivedProjects;
    
    console.log(`📁 Archived projects retrieved: ${deletedProjects.length} items`);
    
    res.json({
      success: true,
      message: 'Archived projects retrieved successfully',
      data: deletedProjects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems, // استخدام العدد الصحيح من findAndCountAll
        itemsPerPage: parseInt(limit),
        hasNextPage: (parseInt(page) * parseInt(limit)) < totalItems,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching archived projects:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المشاريع المؤرشفة',
      error: error.message
    });
  }
});

// @route   PATCH /api/archive/projects/:id/restore
// @desc    Restore archived project (not implemented - soft delete not supported)
// @access  Private
router.patch('/projects/:id/restore', requirePermission('manage_archive'), async (req, res) => {
  try {
    res.status(501).json({
      success: false,
      message: 'استعادة المشاريع غير مدعومة حالياً - يجب تفعيل soft delete أولاً'
    });
  } catch (error) {
    console.error('Error restoring project:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استعادة المشروع'
    });
  }
});

// @route   DELETE /api/archive/projects/:id/permanent
// @desc    Permanently delete project (not implemented - soft delete not supported)
// @access  Private
router.delete('/projects/:id/permanent', requirePermission('manage_archive'), async (req, res) => {
  try {
    res.status(501).json({
      success: false,
      message: 'حذف المشاريع نهائياً غير مدعوم حالياً - يجب تفعيل soft delete أولاً'
    });
  } catch (error) {
    console.error('Error permanently deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المشروع نهائياً'
    });
  }
});

// Tasks Archive Routes
// @route   GET /api/archive/tasks
// @desc    Get archived tasks with soft delete support
// @access  Private
router.get('/tasks', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    // Build where condition for soft deleted tasks
    const whereCondition = {};
    
    // Add search functionality
    if (search) {
      whereCondition[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { assignedTo: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Add condition to get only soft deleted records
    whereCondition.deleted_at = { [Op.ne]: null };
    
    // Get archived tasks from database (soft deleted)
    const { rows: archivedTasks, count: totalItems } = await Task.findAndCountAll({
      where: whereCondition,
      order: [['deleted_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      paranoid: false // Include soft deleted records
    });
    
    // All results are already deleted records
    const deletedTasks = archivedTasks;
    
    console.log(`📁 Archived tasks retrieved: ${deletedTasks.length} items`);
    
    res.json({
      success: true,
      message: 'Archived tasks retrieved successfully',
      data: deletedTasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: deletedTasks.length,
        itemsPerPage: parseInt(limit),
        hasNextPage: (parseInt(page) * parseInt(limit)) < deletedTasks.length,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching archived tasks:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المهام المؤرشفة'
    });
  }
});

// @route   PATCH /api/archive/tasks/:id/restore
// @desc    Restore archived task with soft delete support
// @access  Private
router.patch('/tasks/:id/restore', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the soft deleted task
    const task = await Task.findByPk(id, { paranoid: false });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'المهمة غير موجودة'
      });
    }
    
    if (task.deleted_at === null) {
      return res.status(400).json({
        success: false,
        message: 'المهمة غير مؤرشفة'
      });
    }
    
    // Restore the task
    await task.restore();
    
    console.log(`♻️ Task restored: ${task.id} - ${task.title}`);
    
    res.json({
      success: true,
      message: 'تم استعادة المهمة بنجاح',
      data: task
    });
  } catch (error) {
    console.error('Error restoring task:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء استعادة المهمة'
    });
  }
});

// @route   DELETE /api/archive/tasks/:id/permanent
// @desc    Permanently delete task with soft delete support
// @access  Private
router.delete('/tasks/:id/permanent', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the soft deleted task
    const task = await Task.findByPk(id, { paranoid: false });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'المهمة غير موجودة'
      });
    }
    
    if (task.deleted_at === null) {
      return res.status(400).json({
        success: false,
        message: 'المهمة غير مؤرشفة - لا يمكن حذفها نهائياً'
      });
    }
    
    // Permanently delete the task
    await task.destroy({ force: true });
    
    console.log(`🗑️ Task permanently deleted: ${task.id} - ${task.title}`);
    
    res.json({
      success: true,
      message: 'تم حذف المهمة نهائياً'
    });
  } catch (error) {
    console.error('Error permanently deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المهمة نهائياً'
    });
  }
});

module.exports = router;
