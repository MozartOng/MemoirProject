// routes/appointmentRoutes.js
const express = require('express');
const {
  createAppointment,
  getMyAppointments,
  getAppointments,
  updateAppointment,
} = require('../controller/appointmentController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

// Define the fields for file uploads
const uploadFields = [
  { name: 'files', maxCount: 3 }, // General files (up to 3)
  { name: 'excavationPhotos', maxCount: 1 },
  { name: 'engineerReport', maxCount: 1 },
  { name: 'concreteStudy', maxCount: 1 },
  { name: 'currentWorkPhotos', maxCount: 1 },
  { name: 'workAcceptanceReport', maxCount: 1 },
  { name: 'concreteResults', maxCount: 1 },
  { name: 'sitePhotos', maxCount: 1 },
  { name: 'formworkAcceptanceReport', maxCount: 1 },
  { name: 'sitePhotoTemporary', maxCount: 1 },
  { name: 'ownerInvitationTemporary', maxCount: 1 },
  { name: 'temporaryAcceptanceCopy', maxCount: 1 },
  { name: 'ownerInvitationFinal', maxCount: 1 },
];

router.post('/', authMiddleware, upload.fields(uploadFields), createAppointment);
router.get('/my-appointments', authMiddleware, getMyAppointments);
router.get('/', authMiddleware, adminMiddleware, getAppointments);
router.patch('/:id', authMiddleware, adminMiddleware, updateAppointment);

module.exports = router;