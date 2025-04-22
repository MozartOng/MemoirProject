// src/routes/user.routes.js
const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Get profile of the currently logged-in user
router.get('/me', authenticateToken, userController.getCurrentUserProfile);

// Admin only: Get list of all users
router.get('/', authenticateToken, isAdmin, userController.getAllUsers);


module.exports = router;