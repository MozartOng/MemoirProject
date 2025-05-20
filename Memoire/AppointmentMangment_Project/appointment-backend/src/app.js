// src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const projectRoutes = require('./routes/project.routes'); // <-- NEW: Import project routes

// Import Middleware
const errorHandler = require('./middleware/error.middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static File Serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/projects', projectRoutes); // <-- NEW: Use project routes

// Health Check
app.get('/health', (req, res) => { /* ... */ });

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
