// src/utils/jwt.util.js
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure JWT_SECRET is loaded

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (payload) => {
  // Payload typically includes user id and role
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' }); // Token expires in 1 day
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null; // Invalid token
  }
};

module.exports = {
  generateToken,
  verifyToken,
};