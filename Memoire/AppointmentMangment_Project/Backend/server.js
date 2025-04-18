// server.js
const express = require('express');
const dotenv = require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');
const cors = require('cors');


const app = express();



// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://127.0.0.1:5500', // Match the frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow necessary methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
  credentials: false, // No cookies are sent, so this can be false
}));
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  res.on('finish', () => {
    logger.info(`Response for ${req.method} ${req.url}: Status ${res.statusCode}, Headers: ${JSON.stringify(res.getHeaders())}`);
  });
  next();
});

// Routes
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);

// Error Handling
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});