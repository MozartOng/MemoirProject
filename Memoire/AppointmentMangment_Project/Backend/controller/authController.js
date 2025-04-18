// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const logger = require('../utils/logger');

const register = async (req, res, next) => {
  try {
    const { full_name, email, password, role, company_name } = req.body;

    if (!full_name || !email || !password || !role || !company_name) {
      const error = new Error('All fields are required');
      error.status = 400;
      throw error;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const error = new Error('Email already exists');
      error.status = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        full_name,
        email,
        password: hashedPassword,
        role,
        company_name,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.status = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.status = 400;
      throw error;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'admin') {
      const error = new Error('Invalid admin credentials');
      error.status = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const error = new Error('Invalid admin credentials');
      error.status = 401;
      throw error;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Admin login successful', token });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, adminLogin };