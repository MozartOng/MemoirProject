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
        'admin': 'ADMIN'
    };
    // Ensure roleString is not null or undefined before calling toLowerCase
    if (typeof roleString !== 'string') {
        return null;
    }
    return roleMap[roleString.toLowerCase()] || null; // Convert to lowercase for lookup
};


exports.register = async (req, res, next) => {
  // projectIds will be an array of integers from the frontend
  const { fullName, email, role, companyName, password, projectIds } = req.body;

  if (!fullName || !email || !role || !companyName || !password || password.length < 8) {
    return res.status(400).json({ message: 'All fields are required and password must be at least 8 characters long.' });
  }

  // The 'role' from frontend is already in uppercase e.g., "CONTRACTOR"
  // The mapRoleToEnum function will convert it to lowercase for the lookup.
  const prismaRole = mapRoleToEnum(role); // Pass the role as is

  if (!prismaRole) {
      // This will now correctly find 'CONTRACTOR' in the map after it's lowercased.
      return res.status(400).json({ message: 'Invalid role specified. Ensure the role is one of: CONTRACTOR, ENGINEERING, OWNER, LAB.' });
  }

  // Validate projectIds if provided
  if (projectIds && (!Array.isArray(projectIds) || !projectIds.every(id => Number.isInteger(id)))) {
    return res.status(400).json({ message: 'projectIds must be an array of integers.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(409).json({ message: 'Email address already in use.' });
    }

    const hashedPassword = await hashPassword(password);

    const userData = {
        fullName,
        email,
        role: prismaRole, // This will now be the correct Prisma enum value, e.g., 'CONTRACTOR'
        companyName,
        password: hashedPassword,
    };

    // If projectIds are provided, set up the connect operation for the many-to-many relation
    if (projectIds && projectIds.length > 0) {
        userData.projects = {
            connect: projectIds.map(id => ({ id: id }))
        };
    }

    const user = await prisma.user.create({
      data: userData,
      include: { // Optionally include projects in the response
          projects: { select: { id: true, name: true } }
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword });
  } catch (error) {
    console.error("Registration Error:", error); // Log the full error on the server
    // Handle cases where a projectId might not exist (Prisma will throw an error)
    if (error.code === 'P2025' && error.message.includes('connect')) {
        return res.status(400).json({ message: 'One or more provided project IDs do not exist.' });
    }
    // Handle other Prisma errors or general errors
    if (error.code) { // Prisma error
        return res.status(500).json({ message: `Database error: ${error.message}`});
    }
    next(error); // For other unexpected errors
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
    console.error("Login Error:", error);
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
      if (!user || user.role !== 'ADMIN') { // Prisma Role enum is uppercase
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
      console.error("Admin Login Error:", error);
      next(error);
    }
  };
