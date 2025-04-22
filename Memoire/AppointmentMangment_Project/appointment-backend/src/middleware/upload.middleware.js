// src/middleware/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Create a unique filename: fieldname-timestamp.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Basic file filter (accept common image/pdf types)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes), false);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size (e.g., 10MB)
  fileFilter: fileFilter,
});

// Middleware to handle specific fields from the appointment form
// Based on your frontend `name` attributes for file inputs
const appointmentUpload = upload.fields([
    { name: 'files', maxCount: 3 }, // General file upload
    // Workshop specific files
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
    { name: 'ownerInvitationFinal', maxCount: 1 }
]);


module.exports = { appointmentUpload };