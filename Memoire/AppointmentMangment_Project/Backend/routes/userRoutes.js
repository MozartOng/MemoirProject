// routes/userRoutes.js
const express = require('express');
const { getUsers , getUserProfile} = require('../controller/userController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, getUsers);
router.get('/profile', authMiddleware, getUserProfile); // Get authenticated user's profile

module.exports = router;