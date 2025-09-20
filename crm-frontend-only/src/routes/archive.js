const express = require('express');
const router = express.Router();
const { requirePermission } = require('../middleware/permissions');
const { Sale, Project, sequelize } = require('../../models');

// Sales Archive Routes
// @route   GET /api/archive/sales
// @desc    Get archived sales from real database
// @access  Private
router.get('/sales', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    // Build where condition for soft deleted sales
    const whereCondition = {
      deleted_at: { [sequelize.Op.ne]: null }
    };
    
    // Add search functionality
    if (search) {
      whereCondition[sequelize.Op.or] = [
        { client_name: { [sequelize.Op.iLike]: `%${search}%` } },
        { project_name: { [sequelize.Op.iLike]: `%${search}%` } },
        { unit_type: { [sequelize.Op.iLike]: `%${search}%` } },
        { sales_person: { [sequelize.Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Get archived sales from database
    const { rows: archivedSales, count: totalItems } = await Sale.findAndCountAll({
      where: whereCondition,
      order: [['deleted_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      paranoid: false // Include soft deleted records
    });
    
    console.log(`📁 Archived sales retrieved from DB: ${archivedSales.length} items`);
    
    res.json({
      success: true,
      message: 'Archived sales retrieved successfully',
      data: archivedSales,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: (parseInt(page) * parseInt(limit)) < totalItems,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching archived sales:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المبيعات المؤرشفة'
    });
  }
});

// @route   PATCH /api/archive/sales/:id/restore
// @desc    Restore archived sale from real database
// @access  Private
router.patch('/sales/:id/restore', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the archived sale
    const sale = await Sale.findByPk(id, { paranoid: false });
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'المبيعة غير موجودة'
      });
    }
    
    if (!sale.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'المبيعة غير مؤرشفة'
      });
    }
    
    // Restore the sale (set deleted_at to null)
    await sale.restore();
    
    console.log(`♻️ Sale restored from DB: ${sale.id}`);
    
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
// @desc    Permanently delete sale from real database
// @access  Private
router.delete('/sales/:id/permanent', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the archived sale
    const sale = await Sale.findByPk(id, { paranoid: false });
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'المبيعة غير موجودة'
      });
    }
    
    if (!sale.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'المبيعة يجب أن تكون مؤرشفة أولاً'
      });
    }
    
    // Permanently delete from database
    await sale.destroy({ force: true });
    
    console.log(`⚠️ Sale permanently deleted from DB: ${sale.id}`);
    
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
// @desc    Get archived projects from real database
// @access  Private
router.get('/projects', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    
    // Build where condition for soft deleted projects
    const whereCondition = {
      deleted_at: { [sequelize.Op.ne]: null }
    };
    
    // Add search functionality
    if (search) {
      whereCondition[sequelize.Op.or] = [
        { name: { [sequelize.Op.iLike]: `%${search}%` } },
        { description: { [sequelize.Op.iLike]: `%${search}%` } },
        { location: { [sequelize.Op.iLike]: `%${search}%` } },
        { developer: { [sequelize.Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Get archived projects from database
    const { rows: archivedProjects, count: totalItems } = await Project.findAndCountAll({
      where: whereCondition,
      order: [['deleted_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      paranoid: false // Include soft deleted records
    });
    
    console.log(`📁 Archived projects retrieved from DB: ${archivedProjects.length} items`);
    
    res.json({
      success: true,
      message: 'Archived projects retrieved successfully',
      data: archivedProjects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: (parseInt(page) * parseInt(limit)) < totalItems,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching archived projects:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب المشاريع المؤرشفة'
    });
  }
});

// @route   PATCH /api/archive/projects/:id/restore
// @desc    Restore archived project from real database
// @access  Private
router.patch('/projects/:id/restore', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the archived project
    const project = await Project.findByPk(id, { paranoid: false });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    if (!project.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'المشروع غير مؤرشف'
      });
    }
    
    // Restore the project (set deleted_at to null)
    await project.restore();
    
    console.log(`♻️ Project restored from DB: ${project.id}`);
    
    res.json({
      success: true,
      message: 'تم استعادة المشروع بنجاح',
      data: project
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
// @desc    Permanently delete project from real database
// @access  Private
router.delete('/projects/:id/permanent', requirePermission('manage_archive'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the archived project
    const project = await Project.findByPk(id, { paranoid: false });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'المشروع غير موجود'
      });
    }
    
    if (!project.deleted_at) {
      return res.status(400).json({
        success: false,
        message: 'المشروع يجب أن يكون مؤرشفاً أولاً'
      });
    }
    
    // Permanently delete from database
    await project.destroy({ force: true });
    
    console.log(`⚠️ Project permanently deleted from DB: ${project.id}`);
    
    res.json({
      success: true,
      message: 'تم حذف المشروع نهائياً'
    });
  } catch (error) {
    console.error('Error permanently deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المشروع نهائياً'
    });
  }
});

module.exports = router;




