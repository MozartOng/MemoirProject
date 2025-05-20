// src/routes/project.routes.js
const express = require('express');
const projectController = require('../controllers/project.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware'); // Assuming you have these

const router = express.Router();

// --- Route for project selection in dropdowns (e.g., for booking appointments) ---
// This route is accessed by authenticated users (not necessarily admins)
// The controller itself handles role-based filtering.
router.get('/for-selection', authenticateToken, projectController.getProjectsForSelection);


// --- Admin-Only Project Management Routes ---
// All routes below this point require the user to be an authenticated Admin.
router.use(authenticateToken);
router.use(isAdmin);

// POST /api/projects - Create a new project (Admin only)
router.post('/', projectController.createProject);

// GET /api/projects/admin-list - Get all projects for the admin dashboard (includes extra details like latest visit)
// Changed the path slightly to differentiate from a potential general user project list if you ever add one.
// Or you can keep it as GET /api/projects if that's the sole endpoint for listing all projects.
router.get('/admin-list', projectController.getAllProjectsAdmin);
// If you prefer GET /api/projects for the admin list, use:
// router.get('/', projectController.getAllProjectsAdmin);


// GET /api/projects/:id - Get a single project by ID (Admin only)
router.get('/:id', projectController.getProjectById);

// PATCH /api/projects/:id - Update a project by ID (Admin only)
router.patch('/:id', projectController.updateProject);

// DELETE /api/projects/:id - Delete a project by ID (Admin only)
router.delete('/:id', projectController.deleteProject);


module.exports = router;
