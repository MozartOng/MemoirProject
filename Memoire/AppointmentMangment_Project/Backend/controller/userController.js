// controllers/userController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Existing getUsers function (for admins)
const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        company_name: true,
        created_at: true,
      },
    });

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// New function to get the authenticated user's profile
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // req.user is set by authMiddleware
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        company_name: true,
        created_at: true,
      },
    });

    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserProfile };