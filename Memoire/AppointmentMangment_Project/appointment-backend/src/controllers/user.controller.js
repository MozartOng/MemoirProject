// src/controllers/user.controller.js
const { PrismaClient ,Role } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllUsers = async (req, res, next) => {
    try {
        // Fetch all users, excluding admins maybe? Or include them? Decide based on needs.
        // Exclude password field from the result.
        const users = await prisma.user.findMany({
            where: {
                
                role: {
                    not: 'ADMIN'
                }
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

exports.getUserById = async (req, res, next) => {
    const userId = parseInt(req.params.id);
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { // Exclude password
                id: true,
                fullName: true,
                email: true,
                role: true,
                companyName: true,
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(user);
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

exports.deleteUserById = async (req, res, next) => {
    const userIdToDelete = parseInt(req.params.id);
    const loggedInAdminId = req.user.id;

    if (userIdToDelete === loggedInAdminId) {
        return res.status(403).json({ message: "Administrators cannot delete their own account." });
    }

    try {
        const userToDelete = await prisma.user.findUnique({ where: { id: userIdToDelete } });

        if (!userToDelete) {
            return res.status(404).json({ message: "User not found." });
        }

        if (userToDelete.role === Role.ADMIN) {
            return res.status(403).json({ message: "Cannot delete other admin accounts." });
        }

        await prisma.user.delete({
            where: { id: userIdToDelete },
        });
        res.status(200).json({ message: `User ${userToDelete.fullName} deleted successfully.` });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "User not found for deletion." });
        }
        next(error);
    }
};

exports.updateUserById = async (req, res, next) => {
    const userIdToUpdate = parseInt(req.params.id);
    const loggedInAdminId = req.user.id;

    // Prevent admin from updating their own role/critical fields via this generic endpoint
    if (userIdToUpdate === loggedInAdminId) {
        // Could allow updating own name/company, but role changes should be more controlled
        // For simplicity, let's disallow self-update via this specific endpoint for now.
        // A separate "update my profile" endpoint would be better for self-updates.
        // return res.status(403).json({ message: "Administrators cannot update their own account details through this endpoint." });
    }

    const { fullName, email, role: roleString, companyName } = req.body;

    // Validate input
    if (!fullName || !email || !roleString || !companyName) {
        return res.status(400).json({ message: "Full name, email, role, and company name are required." });
    }

    const newRole = mapRoleToEnum(roleString); // Use your existing mapRoleToEnum
    if (!newRole) {
        return res.status(400).json({ message: "Invalid role specified." });
    }
    // Security: Prevent escalating a user to ADMIN role via this form by non-superadmin
    // Or prevent changing role to ADMIN altogether here.
    if (newRole === Role.ADMIN && req.user.role !== Role.ADMIN /* Or a specific superadmin check */) {
        return res.status(403).json({ message: "You are not authorized to assign Admin role." });
    }


    try {
        // Check if the target user exists
        const existingUser = await prisma.user.findUnique({ where: { id: userIdToUpdate }});
        if (!existingUser) {
            return res.status(404).json({ message: "User to update not found."});
        }

        // If email is being changed, check if the new email is already taken by ANOTHER user
        if (email !== existingUser.email) {
            const emailTaken = await prisma.user.findUnique({ where: { email: email } });
            if (emailTaken) {
                return res.status(409).json({ message: "New email address is already in use by another account." });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userIdToUpdate },
            data: {
                fullName,
                email, // Be cautious allowing email changes; might need re-verification flow
                role: newRole,
                companyName,
                updatedAt: new Date() // Explicitly set updatedAt
            },
            select: { id: true, fullName: true, email: true, role: true, companyName: true, updatedAt: true } // Exclude password
        });
        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(409).json({ message: "Email address is already in use." });
        }
        next(error);
    }
};

const mapRoleToEnum = (roleString) => {
    const roleMap = {
        'contractor': Role.CONTRACTOR,
        'engineering': Role.ENGINEERING,
        'owner': Role.OWNER,
        'lab': Role.LAB,
        // 'admin': Role.ADMIN, // Typically don't allow setting to ADMIN via general update form
    };
    return roleMap[roleString?.toLowerCase()] || null;
};