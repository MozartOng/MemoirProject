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
    return map[statusString?.toLowerCase()];
};


// --- Get all projects for Admin view (includes latest completed visit) ---
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
                // Fetch the latest completed appointment for each project
                appointments: {
                    where: {
                        status: AppointmentStatus.COMPLETED
                    },
                    orderBy: {
                        proposedDateTime: 'desc' // Assuming this is the most relevant date for "latest"
                    },
                    take: 1, // We only need the most recent one
                    select: {
                        id: true,
                        visitReason: true,
                        workshopDetail: true,
                        proposedDateTime: true,
                        status: true // To confirm it's COMPLETED
                    }
                }
            },
            orderBy: {
                createdAt: 'desc' // Order projects by creation date or name, etc.
            }
        });

        // Transform the projects to have a more direct 'latestCompletedVisit' field
        const projectsToReturn = projectsFromDb.map(project => {
            const latestCompletedAppointment = project.appointments && project.appointments.length > 0
                ? project.appointments[0]
                : null;
            // eslint-disable-next-line no-unused-vars
            const { appointments, ...projectDetails } = project; // Exclude the 'appointments' array from the final project object
            return {
                ...projectDetails,
                latestCompletedVisit: latestCompletedAppointment // Add the single latest visit object
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
    const userRole = req.user.role; // This should be a Role enum value from the token

    let whereClause = {
        // Default: Users can only select projects they are assigned to.
        users: {
            some: {
                id: userId
            }
        }
    };

    // Role-specific status filtering
    if (userRole === Role.CONTRACTOR) {
        whereClause.status = ProjectStatus.ONGOING;
    } else if (userRole === Role.OWNER || userRole === Role.ENGINEERING) {
        // Owners/Engineers might see PLANNED and ONGOING projects they are assigned to.
        whereClause.OR = [
            { status: ProjectStatus.ONGOING },
            { status: ProjectStatus.PLANNED }
        ];
    } else if (userRole === Role.LAB) {
        // Labs might also only see ONGOING projects they are assigned to.
        whereClause.status = ProjectStatus.ONGOING;
    } else if (userRole === Role.ADMIN) {
        // Admins:
        // Option 1: See ALL projects in the system for selection (remove user assignment filter)
        // whereClause = {};
        // Option 2: See all projects they are assigned to, regardless of status (current logic below)
        // No specific status filter for admin, they see all statuses of their assigned projects.
        // Option 3: See all ONGOING and PLANNED projects in the system (if not tied to user assignment)
        // whereClause = { OR: [{ status: ProjectStatus.ONGOING }, { status: ProjectStatus.PLANNED }] };

        // Current: Admin sees all statuses of projects they are assigned to.
        // If you want admin to see ALL projects in the system, uncomment the line below
        // and comment out the 'users' part of the initial whereClause.
        // whereClause = {}; // This would fetch ALL projects for admin.
    }


    try {
        const projects = await prisma.project.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                location: true,
                status: true // Good to send for context, even if filtered
            },
            orderBy: {
                name: 'asc' // Or createdAt, etc.
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
    // Ensure only authorized roles (e.g., ADMIN) can create projects
    if (req.user.role !== Role.ADMIN) {
        return res.status(403).json({ message: "Forbidden: Only admins can create projects." });
    }

    const { name, location, status: statusStr, userIds } = req.body; // userIds is an array of user IDs to assign

    if (!name || !location) {
        return res.status(400).json({ message: 'Project name and location are required.' });
    }

    const status = statusStr ? mapProjectStatusToEnum(statusStr) : ProjectStatus.PLANNED; // Default to PLANNED
    if (statusStr && !status) {
        return res.status(400).json({ message: `Invalid project status: ${statusStr}` });
    }

    try {
        const projectData = {
            name,
            location,
            status,
        };

        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            // Ensure userIds are integers
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
                users: { select: { id: true, fullName: true } } // Include users in response
            }
        });
        res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (error) {
        console.error("Create Project Error:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            return res.status(409).json({ message: 'Project name already exists.' });
        }
        if (error.code === 'P2025') { // Caused by trying to connect non-existent users
            return res.status(400).json({ message: 'One or more user IDs provided for assignment do not exist.' });
        }
        next(error);
    }
};

// --- Update an existing project (Admin only or specific roles) ---
exports.updateProject = async (req, res, next) => {
    if (req.user.role !== Role.ADMIN) {
        return res.status(403).json({ message: "Forbidden: Only admins can update projects." });
    }
    const projectId = parseInt(req.params.id);
    const { name, location, status: statusStr, userIds } = req.body; // userIds for updating assignments

    if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID.' });
    }

    let status = undefined;
    if (statusStr) {
        status = mapProjectStatusToEnum(statusStr);
        if (!status) {
            return res.status(400).json({ message: `Invalid project status: ${statusStr}` });
        }
    }

    try {
        const projectToUpdate = await prisma.project.findUnique({ where: { id: projectId } });
        if (!projectToUpdate) {
            return res.status(404).json({ message: "Project not found." });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (location) updateData.location = location;
        if (status) updateData.status = status;

        if (userIds && Array.isArray(userIds)) {
            // userIds should be an array of all user IDs that should be connected to this project.
            // Prisma's `set` operation for many-to-many relations is used to replace all existing connections.
            const validUserIds = userIds.map(id => parseInt(id)).filter(id => !isNaN(id));
            updateData.users = {
                set: validUserIds.map(id => ({ id: id })) // Replaces all existing user connections
            };
        } else if (userIds === null || (Array.isArray(userIds) && userIds.length === 0)) {
            // If an empty array or null is passed, disconnect all users.
            updateData.users = {
                set: []
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
        if (error.code === 'P2025') { // Record to update not found OR error in relational update (e.g. user ID in set not found)
            return res.status(400).json({ message: `Update failed: ${error.meta?.cause || 'Project not found or invalid user ID for assignment.'}` });
        }
        next(error);
    }
};

// --- Delete a project (Admin only) ---
exports.deleteProject = async (req, res, next) => {
    if (req.user.role !== Role.ADMIN) {
        return res.status(403).json({ message: "Forbidden: Only admins can delete projects." });
    }
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID.' });
    }

    try {
        // Optional: Check for related appointments before deleting, if you have a restrictive policy.
        // const relatedAppointments = await prisma.appointment.count({ where: { projectId } });
        // if (relatedAppointments > 0) {
        //     return res.status(400).json({ message: 'Cannot delete project: It has associated appointments. Please delete or reassign them first.' });
        // }

        await prisma.project.delete({
            where: { id: projectId }
        });
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error("Delete Project Error:", error);
        if (error.code === 'P2025') { // Record to delete not found
            return res.status(404).json({ message: "Project not found for deletion." });
        }
        if (error.code === 'P2003') { // Foreign key constraint (e.g. appointments still linked and onDelete is Restrict)
            return res.status(400).json({ message: "Cannot delete project as it has related records (e.g., appointments). Please ensure all related data is handled."});
        }
        next(error);
    }
};

// --- Get a single project by ID (e.g., for fetching details for update form) ---
exports.getProjectById = async (req, res, next) => {
    // Add role check if necessary, e.g., only admin or assigned users can fetch details
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID.' });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                users: {
                    select: { id: true, fullName: true, email: true, role: true }
                },
                // Optionally, include some summary of appointments or the latest one if needed for a detail view
                // appointments: {
                //     orderBy: { proposedDateTime: 'desc' },
                //     take: 5, // Example: last 5 appointments
                //     select: { id: true, status: true, proposedDateTime: true, visitReason: true }
                // }
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
