const { Note, User } = require('../../models');
const { body, validationResult, query } = require('express-validator');
const { Op } = require('sequelize');

// Get notes for a specific item
exports.getNotesByItem = [
  query('itemType').isIn(['lead', 'client', 'project', 'task']).withMessage('Invalid item type'),
  query('itemId').isInt({ min: 1 }).withMessage('Invalid item ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { itemType, itemId, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: notes } = await Note.findAndCountAll({
        where: {
          itemType,
          itemId: parseInt(itemId)
        },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        message: 'Notes retrieved successfully',
        data: notes,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get notes error:', error);
      res.status(500).json({
        message: 'Server error while retrieving notes',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Create new note
exports.createNote = [
  body('content').trim().notEmpty().withMessage('Note content is required'),
  body('itemType').isIn(['lead', 'client', 'project', 'task']).withMessage('Invalid item type'),
  body('itemId').isInt({ min: 1 }).withMessage('Invalid item ID'),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { content, itemType, itemId } = req.body;

      const note = await Note.create({
        content,
        itemType,
        itemId: parseInt(itemId),
        createdBy: req.user.id.toString(),
        createdByName: req.user.name || req.user.email
      });

      res.status(201).json({
        message: 'Note created successfully',
        data: note
      });

    } catch (error) {
      console.error('Create note error:', error);
      res.status(500).json({
        message: 'Server error while creating note',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Update note
exports.updateNote = [
  // Content is required only if it's not a manager comment update
  body('content').optional().trim(),
  body('managerComment').optional().trim(),
  body('managerCommentBy').optional().trim(),
  body('managerCommentAt').optional().isISO8601(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { content, managerComment, managerCommentBy, managerCommentAt } = req.body;

      // Check if at least one field is provided
      if (!content && !managerComment) {
        return res.status(400).json({
          message: 'Either content or managerComment is required',
          code: 'INVALID_INPUT'
        });
      }

      const note = await Note.findByPk(id);
      if (!note) {
        return res.status(404).json({
          message: 'Note not found',
          code: 'NOTE_NOT_FOUND'
        });
      }

      // Prepare update data
      const updateData = {};

      // If updating content (regular note update)
      if (content !== undefined) {
        // Check if user is the author or has admin privileges for content updates
        if (note.createdBy !== req.user.id.toString() && !['admin', 'sales_manager'].includes(req.user.role)) {
          return res.status(403).json({
            message: 'Access denied. You can only edit your own notes.',
            code: 'ACCESS_DENIED'
          });
        }
        updateData.content = content;
      }

      // If adding manager comment (manager/admin only)
      if (managerComment !== undefined) {
        // Check if user has admin/manager privileges for manager comments
        if (!['admin', 'sales_manager'].includes(req.user.role)) {
          return res.status(403).json({
            message: 'Access denied. Only managers can add manager comments.',
            code: 'ACCESS_DENIED'
          });
        }
        updateData.managerComment = managerComment;
        updateData.managerCommentBy = managerCommentBy || req.user.name || req.user.email;
        updateData.managerCommentAt = managerCommentAt || new Date();
      }

      await note.update(updateData);

      const updatedNote = await Note.findByPk(id);

      res.json({
        message: managerComment ? 'Manager comment added successfully' : 'Note updated successfully',
        data: updatedNote
      });

    } catch (error) {
      console.error('Update note error:', error);
      res.status(500).json({
        message: 'Server error while updating note',
        code: 'SERVER_ERROR'
      });
    }
  }
];

// Delete note
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).json({
        message: 'Note not found',
        code: 'NOTE_NOT_FOUND'
      });
    }

    // Check if user is the author or has admin privileges
    if (note.createdBy !== req.user.id.toString() && !['admin', 'sales_manager'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. You can only delete your own notes.',
        code: 'ACCESS_DENIED'
      });
    }

    await note.destroy();

    res.json({
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      message: 'Server error while deleting note',
      code: 'SERVER_ERROR'
    });
  }
};