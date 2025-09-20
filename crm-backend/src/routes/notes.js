const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const noteController = require('../controllers/noteController');

// Apply authentication to all note routes
router.use(authMiddleware);

// Get notes for a specific item
// GET /api/notes?itemType=lead&itemId=1&page=1&limit=10
router.get('/', noteController.getNotesByItem);

// Create new note
// POST /api/notes
router.post('/', noteController.createNote);

// Update note
// PUT /api/notes/:id
router.put('/:id', noteController.updateNote);

// Delete note
// DELETE /api/notes/:id
router.delete('/:id', noteController.deleteNote);

module.exports = router;






