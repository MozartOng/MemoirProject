// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    const error = new Error('No token provided');
    error.status = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      const error = new Error('User not found');
      error.status = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (error) {
    error.status = 401;
    error.message = 'Invalid token';
    next(error);
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    const error = new Error('Access denied: Admins only');
    error.status = 403;
    return next(error);
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };