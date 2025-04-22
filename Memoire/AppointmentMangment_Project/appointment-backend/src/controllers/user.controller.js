// src/controllers/user.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllUsers = async (req, res, next) => {
    try {
        // Fetch all users, excluding admins maybe? Or include them? Decide based on needs.
        // Exclude password field from the result.
        const users = await prisma.user.findMany({
            where: {
                // Optionally filter out ADMIN role if needed
                // role: {
                //     not: 'ADMIN'
                // }
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                companyName: true,
                createdAt: true,
                updatedAt: true,
                // Do not select password!
            }
        });
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

// Optional: Get the profile of the currently logged-in user
exports.getCurrentUserProfile = async (req, res, next) => {
    const userId = req.user.id; // From authenticateToken middleware

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                companyName: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};