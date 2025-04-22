// src/middleware/auth.middleware.js
const { verifyToken } = require('../utils/jwt.util');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const userPayload = verifyToken(token);

  if (!userPayload) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  // Attach user info (id, role) to the request object
  req.user = {
    id: userPayload.id,
    role: userPayload.role,
  };
  next();
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
};


module.exports = {
    authenticateToken,
    isAdmin
};