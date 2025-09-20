const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (but should be restricted in production)
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, authController.getCurrentUser);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authMiddleware, authController.logout);

// @route   GET /api/auth/ping
// @desc    Simple ping endpoint to test auth
// @access  Public
router.get('/ping', (req, res) => {
  res.json({ 
    message: 'Auth service is working', 
    timestamp: new Date().toISOString() 
  });
});

// Additional admin routes can be added here as needed

module.exports = router;