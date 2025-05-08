// src/controllers/auth.controller.js
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../utils/password.util');
const { generateToken } = require('../utils/jwt.util');

const prisma = new PrismaClient();

// Map frontend role values to Prisma Enum values
const mapRoleToEnum = (roleString) => {
    const roleMap = {
        'contractor': 'CONTRACTOR',
        'engineering': 'ENGINEERING',
        'owner': 'OWNER',
        'lab': 'LAB',
        'admin': 'ADMIN' // Assuming you might add an admin registration later
    };
    return roleMap[roleString] || null; // Return null or throw error for invalid roles
};


exports.register = async (req, res, next) => {
  const { fullName, email, role, companyName, password } = req.body;

  // Basic Validation
  if (!fullName || !email || !role || !companyName || !password || password.length < 8) {
    return res.status(400).json({ message: 'All fields are required and password must be at least 8 characters long.' });
  }

  const prismaRole = mapRoleToEnum(role);
  if (!prismaRole) {
      return res.status(400).json({ message: 'Invalid role specified.' });
  }
  
  const existingUser = await prisma.user.findUnique({
    where: { email: email },
  });

  if (existingUser) {
    return res.status(409).json({ message: 'Email address already in use.' });
  }

  try {
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        role: prismaRole,
        companyName,
        password: hashedPassword,
      },
    });

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword });
  } catch (error) {
    next(error); // Pass error to the error handling middleware
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' }); // User not found
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' }); // Incorrect password
    }

    // Generate JWT
    const tokenPayload = { id: user.id, role: user.role };
    const token = generateToken(tokenPayload);

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

exports.adminLogin = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Check if user exists AND is an admin
      if (!user || user.role !== 'ADMIN') {
        return res.status(401).json({ message: 'Invalid credentials or insufficient permissions' });
      }

      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT
      const tokenPayload = { id: user.id, role: user.role };
      const token = generateToken(tokenPayload);

      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        message: 'Admin login successful',
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  };