// src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Load environment variables

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); // Enable CORS for all origins (adjust in production)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Serve uploaded files statically (adjust path as needed)
// Allows frontend to access files via http://localhost:3001/uploads/filename.ext
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);

// --- Health Check Route ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// --- Global Error Handler ---
// Must be the LAST middleware
app.use(errorHandler);


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app; // Optional: for testing