// src/controllers/user.controller.js
const { PrismaClient, Role } = require('@prisma/client'); // Ensure Role is imported
const prisma = new PrismaClient();
// const { hashPassword } = require('../utils/password.util'); // Uncomment if you implement password updates

// Helper function to map string role to Prisma Role Enum
const mapRoleToEnum = (roleString) => {
    const roleMap = {
        'contractor': Role.CONTRACTOR,
        'engineering': Role.ENGINEERING,
        'owner': Role.OWNER,
        'lab': Role.LAB,
        // 'admin': Role.ADMIN, // Avoid allowing role changes TO admin via general forms for security
    };
    if (typeof roleString !== 'string') return null;
    return roleMap[roleString.toLowerCase()] || null;
};

// Admin Only: Get all users (excluding other admins and passwords)
// Updated to handle search by fullName or email
exports.getAllUsers = async (req, res, next) => {
    const searchTerm = req.query.search; // Get search term from query parameters
    let whereClause = {
        role: {
            not: Role.ADMIN // Exclude all users with ADMIN role from this general list
        }
    };

    // If a search term is provided, add conditions to the whereClause
    if (searchTerm) {
        whereClause.OR = [
            { fullName: { contains: searchTerm, mode: 'insensitive' } }, // Case-insensitive search for full name
            { email: { contains: searchTerm, mode: 'insensitive' } }    // Case-insensitive search for email
        ];
    }

    try {
        const users = await prisma.user.findMany({
            where: whereClause, // Apply the whereClause which may include search conditions
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                companyName: true,
                createdAt: true,
                updatedAt: true,
                projects: { select: { id: true, name: true } } // Include assigned projects
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json(users);
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        next(error);
    }
};

// Admin Only: Get a single user by ID (for pre-filling update form)
exports.getUserById = async (req, res, next) => {
    const userIdParam = req.params.id;
    const userId = parseInt(userIdParam);

    if (isNaN(userId)) {
        return res.status(400).json({ message: `Invalid user ID format: "${userIdParam}". ID must be an integer.` });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { // Exclude password
                id: true,
                fullName: true,
                email: true,
                role: true,
                companyName: true,
                projects: { // Include projects this user is assigned to
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: `User with ID ${userId} not found.` });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(`Error fetching user by ID ${userId}:`, error);
        next(error);
    }
};


// Admin Only: Update a user's details by ID, including project assignments
exports.updateUserById = async (req, res, next) => {
    const userIdParam = req.params.id;
    const userIdToUpdate = parseInt(userIdParam);

    if (isNaN(userIdToUpdate)) {
        return res.status(400).json({ message: `Invalid user ID format: "${userIdParam}". ID must be an integer.` });
    }

    const { fullName, email, role: roleString, companyName, projectIds } = req.body;

    if (fullName === undefined && email === undefined && roleString === undefined && companyName === undefined && projectIds === undefined) {
        return res.status(400).json({ message: "At least one field must be provided for update (fullName, email, role, companyName, projectIds)." });
    }

    const dataToUpdate = {};
    if (fullName !== undefined) dataToUpdate.fullName = fullName;
    if (companyName !== undefined) dataToUpdate.companyName = companyName;

    if (roleString) {
        const newRole = mapRoleToEnum(roleString);
        if (!newRole) return res.status(400).json({ message: `Invalid role specified: "${roleString}".` });
        if (newRole === Role.ADMIN && (!req.user || req.user.role !== Role.ADMIN)) {
            return res.status(403).json({ message: "Not authorized to assign Admin role." });
        }
        dataToUpdate.role = newRole;
    }

    if (projectIds !== undefined) {
        if (!Array.isArray(projectIds) || !projectIds.every(id => Number.isInteger(parseInt(id)) && !isNaN(parseInt(id)))) {
            return res.status(400).json({ message: 'projectIds must be an array of valid integers.' });
        }
        dataToUpdate.projects = {
            set: projectIds.map(id => ({ id: parseInt(id) }))
        };
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { id: userIdToUpdate }});
        if (!existingUser) {
            return res.status(404).json({ message: "User to update not found."});
        }

        if (existingUser.role === Role.ADMIN && dataToUpdate.role && dataToUpdate.role !== Role.ADMIN) {
            if (!req.user || req.user.role !== Role.ADMIN) {
                 return res.status(403).json({ message: "Not authorized to change the role of an Admin user." });
            }
            if (req.user.id === userIdToUpdate) {
                return res.status(403).json({ message: "Admins cannot change their own role via this endpoint."});
            }
        }

        if (email && email !== existingUser.email) {
            const emailTaken = await prisma.user.findUnique({ where: { email: email } });
            if (emailTaken) {
                return res.status(409).json({ message: "New email address is already in use by another account." });
            }
            dataToUpdate.email = email;
        }
        
        const updatedUser = await prisma.user.update({
            where: { id: userIdToUpdate },
            data: dataToUpdate,
            select: {
                id: true, fullName: true, email: true, role: true, companyName: true, updatedAt: true,
                projects: { select: { id: true, name: true } }
            }
        });
        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error(`Error updating user ${userIdToUpdate}:`, error);
        if (error.code === 'P2025') {
            return res.status(400).json({ message: `Update failed: ${error.meta?.cause || 'User not found or invalid project ID for assignment.'}` });
        }
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(409).json({ message: "Email address is already in use." });
        }
        next(error);
    }
};

// Get current user's profile (for logged-in user to see their own details)
exports.getCurrentUserProfile = async (req, res, next) => {
    if (!req.user || req.user.id === undefined) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    const userId = req.user.id;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, fullName: true, email: true, role: true, companyName: true,
                createdAt: true, updatedAt: true,
                projects: {
                    select: { id: true, name: true, location: true, status: true },
                    orderBy: { name: 'asc' }
                }
            }
        });
        if (!user) return res.status(404).json({ message: 'User profile not found.' });
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching current user profile:", error);
        next(error);
    }
};

// Admin Only: Delete a user by ID
exports.deleteUserById = async (req, res, next) => {
    const userIdParam = req.params.id;
    const userIdToDelete = parseInt(userIdParam);

    if (isNaN(userIdToDelete)) {
        return res.status(400).json({ message: `Invalid user ID format: "${userIdParam}". ID must be an integer.` });
    }

    if (!req.user || req.user.id === undefined || req.user.role !== Role.ADMIN) {
        return res.status(403).json({ message: 'Forbidden: Only admins can delete users.' });
    }
    const loggedInAdminId = req.user.id;

    if (userIdToDelete === loggedInAdminId) {
        return res.status(403).json({ message: "Administrators cannot delete their own account using this function." });
    }

    try {
        const userToDelete = await prisma.user.findUnique({ where: { id: userIdToDelete } });
        if (!userToDelete) {
            return res.status(404).json({ message: "User to delete not found." });
        }
        if (userToDelete.role === Role.ADMIN) {
            return res.status(403).json({ message: "Cannot delete other admin accounts." });
        }

        await prisma.user.delete({
            where: { id: userIdToDelete },
        });
        res.status(200).json({ message: `User ${userToDelete.fullName || userIdToDelete} deleted successfully.` });
    } catch (error) {
        console.error(`Error deleting user ${userIdToDelete}:`, error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "User not found for deletion (perhaps already deleted)." });
        }
        if (error.code === 'P2003') {
            return res.status(400).json({ message: "Cannot delete user: User has related records (e.g., appointments) that prevent deletion."});
        }
        next(error);
    }
};

// New: Get users assignable to projects (e.g., for admin project forms)
exports.getAssignableUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: {
                    not: Role.ADMIN
                }
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                companyName: true
            },
            orderBy: {
                fullName: 'asc'
            }
        });
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching assignable users:", error);
        next(error);
    }
};

exports.getAssignedProjectsForCurrentUser = async (req, res, next) => {
    if (!req.user || req.user.id === undefined) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    const userId = req.user.id;
    const userRole = req.user.role;

    let projectWhereClause = {};

    if (userRole === Role.CONTRACTOR) {
        projectWhereClause.status = 'ONGOING';
    } else if (userRole === Role.OWNER || userRole === Role.ENGINEERING || userRole === Role.LAB) {
        projectWhereClause.OR = [
            { status: 'ONGOING' },
            { status: 'PLANNED' }
        ];
    }

    try {
        const userWithProjects = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                projects: {
                    where: projectWhereClause,
                    select: { id: true, name: true, location: true, status: true },
                    orderBy: { name: 'asc' }
                }
            }
        });
        if (!userWithProjects) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(userWithProjects.projects || []);
    } catch (error) {
        console.error("Error fetching assigned projects for current user:", error);
        next(error);
    }
};
