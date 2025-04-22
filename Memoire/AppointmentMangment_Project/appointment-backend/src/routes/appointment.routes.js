// src/routes/appointment.routes.js
const express = require('express');
const appointmentController = require('../controllers/appointment.controller');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');
const { appointmentUpload } = require('../middleware/upload.middleware'); // Get the specific uploader

const router = express.Router();

// --- Authenticated User Routes ---

// Create a new appointment (handles file uploads)
router.post(
    '/',
    authenticateToken,
    appointmentUpload, // Use multer middleware BEFORE the controller
    appointmentController.createAppointment
);

// Get appointments for the logged-in user (filtered by status query param)
router.get('/', authenticateToken, appointmentController.getUserAppointments);


// --- Admin Only Routes ---

// Get all appointments (filtered by status query param)
router.get('/admin', authenticateToken, isAdmin, appointmentController.getAllAppointmentsAdmin);

// Update appointment status (confirm, reject, complete)
router.patch('/admin/:id/status', authenticateToken, isAdmin, appointmentController.updateAppointmentStatusAdmin);

// Postpone appointment (update date/time and set status to postponed)
router.patch('/admin/:id/postpone', authenticateToken, isAdmin, appointmentController.postponeAppointmentAdmin);


module.exports = router;