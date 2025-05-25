// src/controllers/project.controller.js
const { PrismaClient, AppointmentStatus, VisitReason, WorkshopDetail, Role, ProjectStatus } = require('@prisma/client');
const prisma = new PrismaClient();

// --- Helper Function to map ProjectStatus string to Enum (if needed elsewhere) ---
const mapProjectStatusToEnum = (statusString) => {
    const map = {
        'planned': ProjectStatus.PLANNED,
        'ongoing': ProjectStatus.ONGOING,
        'completed': ProjectStatus.COMPLETED,
        'on_hold': ProjectStatus.ON_HOLD,
        'cancelled': ProjectStatus.CANCELLED
    };
    if (typeof statusString !== 'string') return null;
    return map[statusString.toLowerCase()] || null;
};


// --- Get all projects for Admin view (includes latest completed visit with user details) ---
exports.getAllProjectsAdmin = async (req, res, next) => {
    try {
        const projectsFromDb = await prisma.project.findMany({
            include: {
                users: { // Users assigned to the project
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                        companyName: true
                    }
                },
                appointments: {
                    where: {
                        status: AppointmentStatus.COMPLETED
                    },
                    orderBy: {
                        proposedDateTime: 'desc'
                    },
                    take: 1,
                    select: {
                        id: true,
                        visitReason: true,
                        workshopDetail: true,
                        proposedDateTime: true,
                        status: true,
                        user: {
                            select: {
                                id: true,
                                fullName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const projectsToReturn = projectsFromDb.map(project => {
            const latestCompletedAppointment = project.appointments && project.appointments.length > 0
                ? project.appointments[0]
                : null;
            // eslint-disable-next-line no-unused-vars
            const { appointments, ...projectDetails } = project;
            return {
                ...projectDetails,
                latestCompletedVisit: latestCompletedAppointment
            };
        });

        res.status(200).json(projectsToReturn);
    } catch (error) {
        console.error("Error fetching all projects for admin:", error);
        next(error);
    }
};

// --- Get projects for selection dropdowns (filtered by role and status) ---
exports.getProjectsForSelection = async (req, res, next) => {
    if (!req.user || !req.user.id || !req.user.role) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = {
        users: {
            some: {
                id: userId
            }
        }
    };

    if (userRole === Role.CONTRACTOR) {
        whereClause.status = ProjectStatus.ONGOING;
    } else if (userRole === Role.OWNER || userRole === Role.ENGINEERING) {
        whereClause.OR = [
            { status: ProjectStatus.ONGOING },
            { status: ProjectStatus.PLANNED }
        ];
    } else if (userRole === Role.LAB) {
        whereClause.status = ProjectStatus.ONGOING;
    } else if (userRole === Role.ADMIN) {
        // Admin sees all statuses of projects they are assigned to.
    }


    try {
        const projects = await prisma.project.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                location: true,
                status: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.status(200).json(projects);
    } catch (error) {
        console.error("Error fetching projects for selection:", error);
        next(error);
    }
};


// --- Create a new project (Admin only or specific roles) ---
exports.createProject = async (req, res, next) => {
    if (!req.user || req.user.role !== Role.ADMIN) {
        return res.status(403).json({ message: "Forbidden: Only admins can create projects." });
    }

    // **MODIFIED: 'status' is no longer taken from req.body for creation**
    const { name, location, userIds } = req.body;

    if (!name || !location) {
        return res.status(400).json({ message: 'Project name and location are required.' });
    }

    // **MODIFIED: Status is now defaulted to PLANNED**
    const status = ProjectStatus.PLANNED;

    try {
        const projectData = {
            name,
            location,
            status, // Defaulted to PLANNED
        };

        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            const validUserIds = userIds.map(id => parseInt(id)).filter(id => !isNaN(id));
            if (validUserIds.length > 0) {
                projectData.users = {
                    connect: validUserIds.map(id => ({ id: id }))
                };
            }
        }

        const newProject = await prisma.project.create({
            data: projectData,
            include: {
                users: { select: { id: true, fullName: true } }
            }
        });
        res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (error) {
        console.error("Create Project Error:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            return res.status(409).json({ message: 'Project name already exists.' });
        }
        if (error.code === 'P2025') {
            return res.status(400).json({ message: 'One or more user IDs provided for assignment do not exist.' });
        }
        next(error);
    }
};

// --- Update an existing project (Admin only or specific roles) ---
exports.updateProject = async (req, res, next) => {
    if (!req.user || req.user.role !== Role.ADMIN) {
        return res.status(403).json({ message: "Forbidden: Only admins can update projects." });
    }
    const projectId = parseInt(req.params.id);
    // **MODIFIED: statusStr is now only relevant for updates**
    const { name, location, status: statusStr, userIds } = req.body;

    if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID.' });
    }

    let statusEnum = undefined; // Use a different variable name to avoid confusion
    if (statusStr) { // Only process status if it's provided for an update
        statusEnum = mapProjectStatusToEnum(statusStr);
        if (!statusEnum) {
            return res.status(400).json({ message: `Invalid project status: ${statusStr}` });
        }
    }

    try {
        const projectToUpdate = await prisma.project.findUnique({ where: { id: projectId } });
        if (!projectToUpdate) {
            return res.status(404).json({ message: "Project not found." });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (location !== undefined) updateData.location = location;
        if (statusEnum) updateData.status = statusEnum; // Only include status in updateData if it was provided and valid

        if (userIds !== undefined) {
             if (!Array.isArray(userIds) || !userIds.every(id => Number.isInteger(parseInt(id)) && !isNaN(parseInt(id)))) {
                return res.status(400).json({ message: 'projectIds must be an array of valid integers.' });
            }
            const validUserIds = userIds.map(id => parseInt(id));
            updateData.users = {
                set: validUserIds.map(id => ({ id: id }))
            };
        }


        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
            include: {
                users: { select: { id: true, fullName: true } }
            }
        });
        res.status(200).json({ message: 'Project updated successfully', project: updatedProject });
    } catch (error) {
        console.error("Update Project Error:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            return res.status(409).json({ message: 'Another project with this name already exists.' });
        }
        if (error.code === 'P2025') {
            return res.status(400).json({ message: `Update failed: ${error.meta?.cause || 'Project not found or invalid user ID for assignment.'}` });
        }
        next(error);
    }
};

// --- Delete a project (Admin only) ---
exports.deleteProject = async (req, res, next) => {
    if (!req.user || req.user.role !== Role.ADMIN) {
        return res.status(403).json({ message: "Forbidden: Only admins can delete projects." });
    }
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID.' });
    }

    try {
        await prisma.project.delete({
            where: { id: projectId }
        });
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error("Delete Project Error:", error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Project not found for deletion." });
        }
        if (error.code === 'P2003') {
            return res.status(400).json({ message: "Cannot delete project as it has related records (e.g., appointments). Please ensure all related data is handled."});
        }
        next(error);
    }
};

// --- Get a single project by ID (e.g., for fetching details for update form) ---
exports.getProjectById = async (req, res, next) => {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID.' });
    }
    if (!req.user || req.user.role !== Role.ADMIN) {
       // For fetching details, you might allow more roles if they are assigned to the project
       // For now, keeping it admin-only for simplicity as per previous structure.
       // return res.status(403).json({ message: "Forbidden: Access restricted." });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                users: {
                    select: { id: true, fullName: true, email: true, role: true }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }
        res.status(200).json(project);
    } catch (error) {
        console.error(`Error fetching project ${projectId}:`, error);
        next(error);
    }
};
