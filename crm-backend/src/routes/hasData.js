const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth')
const hasDataController = require('../controllers/hasDataController')

// Get has-data information for clients and/or leads
// GET /api/has-data?clientIds=1,2,3&leadIds=10,11,12
router.get('/', authMiddleware, hasDataController.getHasData)

module.exports = router
