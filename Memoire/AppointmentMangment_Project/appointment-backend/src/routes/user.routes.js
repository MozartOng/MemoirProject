// src/routes/user.routes.js
const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Get profile of the currently logged-in user
router.get('/me', authenticateToken, userController.getCurrentUserProfile);

// Admin only: Get list of all users
router.get('/', authenticateToken, isAdmin, userController.getAllUsers);

// --- NEW: Admin: Get a single user by ID ---
router.get('/:id', authenticateToken, isAdmin, userController.getUserById);

// --- NEW: Admin: Update a user by ID ---
router.patch('/:id', authenticateToken, isAdmin, userController.updateUserById);

// DELETE /api/users/:id - Admin: Delete a user by ID
router.delete('/:id', authenticateToken, isAdmin, userController.deleteUserById);



module.exports = router;