// src/controllers/appointment.controller.js
const { PrismaClient, VisitReason, WorkshopDetail, AppointmentStatus, Role } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
// Assuming you are using date-fns for parsing dd/mm/yyyy format
const { parse } = require('date-fns');

// --- Helper Functions ---

/**
 * Maps a string representation of visit reason to its corresponding Prisma enum value.
 * @param {string} reasonString - The visit reason string (e.g., 'workshop', 'file', 'other').
 * @returns {VisitReason|undefined} The Prisma enum value or undefined if not found.
 */
const mapVisitReasonToEnum = (reasonString) => {
    const map = {
        'other': VisitReason.OTHER,
        'file': VisitReason.FILE,
        'workshop': VisitReason.WORKSHOP
    };
    return map[reasonString?.toLowerCase()];
};

/**
 * Maps a string representation of appointment status to its corresponding Prisma enum value.
 * Allows 'all' for filtering purposes.
 * @param {string} statusString - The status string (e.g., 'pending', 'confirmed', 'all').
 * @returns {AppointmentStatus|'all'|undefined} The Prisma enum value, 'all', or undefined.
 */
const mapStatusToEnum = (statusString) => {
     const map = {
        'pending': AppointmentStatus.PENDING,
        'confirmed': AppointmentStatus.CONFIRMED,
        'rejected': AppointmentStatus.REJECTED,
        'completed': AppointmentStatus.COMPLETED,
        'postponed': AppointmentStatus.POSTPONED
    };
    const lowerStatus = statusString?.toLowerCase();
    return lowerStatus === 'all' ? 'all' : map[lowerStatus];
};

/**
 * Parses a date string (dd/MM/yyyy) and a time string (HH:mm) and combines them into a JavaScript Date object.
 * @param {string} dateStr_ddmmyyyy - The date string in dd/MM/yyyy format.
 * @param {string} timeStr_hhmm - The time string in HH:mm format.
 * @returns {Date|null} A Date object or null if parsing fails or inputs are missing.
 */
const parseAndCombineDateTime_DDMMYYYY = (dateStr_ddmmyyyy, timeStr_hhmm) => {
    if (!dateStr_ddmmyyyy || !timeStr_hhmm) {
        console.error('parseAndCombineDateTime_DDMMYYYY: Missing date or time string.');
        return null;
    }
    try {
        // Example: dateStr_ddmmyyyy = "18/05/2025", timeStr_hhmm = "19:02"
        const combinedStr = `${dateStr_ddmmyyyy} ${timeStr_hhmm}`; // "18/05/2025 19:02"
        const formatString = 'dd/MM/yyyy HH:mm';
        const parsedDateTime = parse(combinedStr, formatString, new Date());

        if (isNaN(parsedDateTime.getTime())) {
            console.error(`parseAndCombineDateTime_DDMMYYYY: Failed to parse date string "${combinedStr}" with format "${formatString}". Resulted in Invalid Date.`);
            return null;
        }
        console.log(`parseAndCombineDateTime_DDMMYYYY: Parsed "${combinedStr}" to Date:`, parsedDateTime);
        return parsedDateTime;
    } catch (e) {
        console.error(`Error parsing dd/MM/yyyy date/time for input "${dateStr_ddmmyyyy} ${timeStr_hhmm}":`, e);
        return null;
    }
};
// --- End Helper Functions ---


// --- Controller Methods ---

/**
 * Creates a new appointment.
 * Expects userId and userRole from req.user (set by auth middleware).
 * Expects date as dd/MM/yyyy and time as HH:mm in req.body.
 */
exports.createAppointment = async (req, res, next) => {
    const {
        projectId, // string from form data
        visitReason: visitReasonStr,
        workshopDetail: workshopDetailStr, // e.g., "REEXECUTION"
        visitDesc,
        date, // Expected format: "dd/MM/yyyy"
        time  // Expected format: "HH:mm"
    } = req.body;

    // Assuming userId and userRole are set by authentication middleware
    if (!req.user || req.user.id === undefined || !req.user.role) {
        return res.status(401).json({ message: 'User authentication required or role missing.' });
    }
    const userId = req.user.id;
    const userRole = req.user.role; // This should be a Role enum value like Role.CONTRACTOR

    // --- Basic Validations ---
    if (projectId === undefined || projectId === null || !visitReasonStr || !visitDesc || !date || !time) {
        return res.status(400).json({ message: 'Project ID, visit reason, description, date, and time are required.' });
    }
    const parsedProjectId = parseInt(projectId);
    if (isNaN(parsedProjectId)) {
        return res.status(400).json({ message: 'Project ID must be an integer.' });
    }

    const visitReasonEnum = mapVisitReasonToEnum(visitReasonStr);
    if (!visitReasonEnum) {
        return res.status(400).json({ message: `Invalid visit reason provided: "${visitReasonStr}". Expected one of: other, file, workshop.` });
    }

    let finalWorkshopDetailEnum = null; // This will hold the validated Prisma enum value or null

    if (visitReasonEnum === VisitReason.WORKSHOP) {
        // For WORKSHOP visits, workshopDetail logic depends on user role
        if (userRole === Role.CONTRACTOR) { // Directly compare with imported Role enum
            if (!workshopDetailStr || workshopDetailStr.toLowerCase() === 'none') {
                return res.status(400).json({ message: 'Workshop detail is required for contractor workshop visits and cannot be "none".' });
            }
            // Validate that the received workshopDetailStr is a valid member of the WorkshopDetail enum
            if (!Object.values(WorkshopDetail).includes(workshopDetailStr)) {
                return res.status(400).json({
                    message: `Invalid workshop detail provided: "${workshopDetailStr}". Expected one of: ${Object.values(WorkshopDetail).join(', ')}`
                });
            }
            finalWorkshopDetailEnum = workshopDetailStr; // Assign the valid enum string
        } else {
            // For non-contractors, workshopDetail is not applicable/set to null even if visit reason is WORKSHOP
            console.log(`User role "${userRole}" selected visit reason WORKSHOP. Workshop detail will be set to null.`);
            // finalWorkshopDetailEnum remains null
        }
    } else if (workshopDetailStr && workshopDetailStr.toLowerCase() !== 'none') {
        // If visitReason is not WORKSHOP, but workshopDetail is provided (and not 'none'), it's likely an error or should be ignored.
        console.warn(`WorkshopDetail ("${workshopDetailStr}") provided for a non-WORKSHOP visitReason ("${visitReasonStr}"). It will be ignored.`);
        // finalWorkshopDetailEnum remains null
    }


    const proposedDateTime = parseAndCombineDateTime_DDMMYYYY(date, time);
    if (!proposedDateTime) {
         return res.status(400).json({ message: 'Invalid date or time format. Ensure date is dd/mm/yyyy and time is hh:mm.' });
    }

    // File Handling (assuming multer middleware populates req.files)
    const uploadedFiles = req.files;
    const filesToCreate = [];
    if (uploadedFiles) {
        for (const fieldName in uploadedFiles) {
           if (Array.isArray(uploadedFiles[fieldName])) { // Check if it's an array of files for that field
                uploadedFiles[fieldName].forEach(file => {
                    // Store path relative to a base 'uploads' directory for portability
                    // Adjust the base path '../../uploads' as per your project structure
                    const relativeFilePath = path.relative(path.resolve(__dirname, '../../uploads'), file.path);
                    filesToCreate.push({
                        filePath: relativeFilePath.replace(/\\/g, '/'), // Normalize path separators to forward slashes
                        originalName: file.originalname,
                        fileType: fieldName, // Use fieldName from multer as fileType
                    });
                });
            }
        }
    }

    try {
        // Verify project exists and the authenticated user is assigned to it
        const projectUserLink = await prisma.project.findFirst({
            where: {
                id: parsedProjectId,
                users: { some: { id: userId } }
            }
        });
        if (!projectUserLink) {
            return res.status(403).json({ message: "Access denied: Project not found or you are not assigned to this project." });
        }

        const appointmentData = {
            userId,
            projectId: parsedProjectId,
            visitReason: visitReasonEnum,
            visitDesc,
            proposedDateTime,
            status: AppointmentStatus.PENDING, // Default status
        };

        if (finalWorkshopDetailEnum) { // Only add workshopDetail if it's valid and set
            appointmentData.workshopDetail = finalWorkshopDetailEnum;
        }

        if (filesToCreate.length > 0) {
            appointmentData.files = { create: filesToCreate };
        }

        const newAppointment = await prisma.appointment.create({
            data: appointmentData,
            include: {
                files: true,
                project: { select: { id: true, name: true, location: true } },
                user: { select: { id: true, fullName: true, companyName: true, role: true } }
            }
        });
        res.status(201).json({ message: 'Appointment created successfully', appointment: newAppointment });
    } catch (error) {
        console.error("Create Appointment Error:", error);
        if (error.code === 'P2003' && error.meta?.field_name?.includes('projectId')) {
            return res.status(400).json({ message: 'Invalid Project ID. The specified project does not exist.' });
        }
        if (error.code === 'P2002') {
             return res.status(409).json({ message: `Database error: A unique constraint would be violated. Details: ${error.meta?.target}` });
        }
        if (error.code === 'P2025') {
            return res.status(404).json({ message: `Database error: An operation failed because it depends on one or more records that were required but not found. ${error.meta?.cause}` });
        }
        if (error.message && error.message.includes("Invalid value for argument")) {
             return res.status(400).json({ message: `Prisma data validation error: ${error.message}` });
        }
        next(error);
    }
};

/**
 * Postpones an appointment (Admin only).
 * Expects newDate (dd/mm/yyyy) and newTime (hh:mm) in req.body.
 */
exports.postponeAppointmentAdmin = async (req, res, next) => {
    const appointmentId = parseInt(req.params.id);
    const { newDate, newTime } = req.body;

    if (isNaN(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointment ID format.' });
    }
    if (!newDate || !newTime) {
         return res.status(400).json({ message: 'New date (dd/mm/yyyy) and time (hh:mm) are required for postponement.' });
    }

    const newProposedDateTime = parseAndCombineDateTime_DDMMYYYY(newDate, newTime);
    if (!newProposedDateTime) {
        return res.status(400).json({ message: 'Invalid new date or time format. Ensure date is dd/mm/yyyy and time is hh:mm.' });
    }

    try {
        const appointmentToUpdate = await prisma.appointment.findUnique({ where: { id: appointmentId }});
        if (!appointmentToUpdate) {
            return res.status(404).json({ message: "Appointment not found for postponement." });
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                proposedDateTime: newProposedDateTime,
                status: AppointmentStatus.POSTPONED
            },
             include: {
                user: { select: { id: true, fullName: true, companyName: true, role: true } },
                files: { select: { id: true, originalName: true, fileType: true, filePath: true } },
                project: { select: { id: true, name: true, location: true, status: true } }
            }
        });
        res.status(200).json({ message: 'Appointment postponed successfully', appointment: updatedAppointment });
    } catch (error) {
        console.error("Postpone Appointment Error:", error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Appointment not found (already deleted or invalid ID)." });
        }
        next(error);
    }
};

/**
 * Gets appointments for the authenticated user.
 * Allows filtering by status query parameter.
 */
exports.getUserAppointments = async (req, res, next) => {
    if (!req.user || req.user.id === undefined) {
        return res.status(401).json({ message: 'User authentication required.' });
    }
    const userId = req.user.id;
    const statusFilterStr = req.query.status;
    const whereClause = { userId };

    if (statusFilterStr && statusFilterStr.toLowerCase() !== 'all') {
        const statusEnum = mapStatusToEnum(statusFilterStr);
        if (statusEnum && statusEnum !== 'all') { // Ensure 'all' from map is not used as Prisma enum
            whereClause.status = statusEnum;
        } else {
            return res.status(400).json({ message: `Invalid status filter: "${statusFilterStr}". Allowed values: pending, confirmed, rejected, completed, postponed, or all.` });
        }
    }

    try {
        const appointments = await prisma.appointment.findMany({
            where: whereClause,
            orderBy: { proposedDateTime: 'asc' },
            include: {
                files: { select: { id: true, originalName: true, fileType: true, filePath: true } },
                project: { select: { id: true, name: true, location: true, status: true } }
            }
        });
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Get User Appointments Error:", error);
        next(error);
    }
};

/**
 * Gets all appointments (Admin only).
 * Allows filtering by status query parameter.
 */
exports.getAllAppointmentsAdmin = async (req, res, next) => {
    const statusFilterStr = req.query.status;
    const whereClause = {};

    if (statusFilterStr && statusFilterStr.toLowerCase() !== 'all') {
        const statusEnum = mapStatusToEnum(statusFilterStr);
        if (statusEnum && statusEnum !== 'all') { // Ensure 'all' from map is not used as Prisma enum
            whereClause.status = statusEnum;
        } else {
            return res.status(400).json({ message: `Invalid status filter: "${statusFilterStr}". Allowed values: pending, confirmed, rejected, completed, postponed, or all.` });
        }
    }

    try {
        const appointments = await prisma.appointment.findMany({
            where: whereClause,
            orderBy: { proposedDateTime: 'asc' },
            include: {
                user: { select: { id: true, fullName: true, companyName: true, role: true } },
                files: { select: { id: true, originalName: true, fileType: true, filePath: true } },
                project: { select: { id: true, name: true, location: true, status: true } }
            }
        });
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Get All Appointments Admin Error:", error);
        next(error);
    }
};

/**
 * Updates the status of an appointment (Admin only).
 * Allowed statuses for update: CONFIRMED, REJECTED, COMPLETED.
 */
exports.updateAppointmentStatusAdmin = async (req, res, next) => {
    const appointmentId = parseInt(req.params.id);
    const { status: statusStr } = req.body;

    if (isNaN(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointment ID format.' });
    }
    if (!statusStr) {
        return res.status(400).json({ message: 'New status is required for update.' });
    }

    const newStatusEnum = mapStatusToEnum(statusStr);
    // Define statuses that an admin is allowed to set directly
    const allowedUpdateStatuses = [AppointmentStatus.CONFIRMED, AppointmentStatus.REJECTED, AppointmentStatus.COMPLETED];

    if (!newStatusEnum || newStatusEnum === 'all' || !allowedUpdateStatuses.includes(newStatusEnum)) {
         return res.status(400).json({ message: `Invalid status for update: "${statusStr}". Allowed values: confirmed, rejected, completed.` });
    }

    try {
        const appointmentToUpdate = await prisma.appointment.findUnique({ where: { id: appointmentId }});
        if (!appointmentToUpdate) {
            return res.status(404).json({ message: "Appointment not found for status update." });
        }

        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: newStatusEnum },
             include: { // Include relevant data in the response
                user: { select: { id: true, fullName: true, companyName: true, role: true } },
                files: { select: { id: true, originalName: true, fileType: true, filePath: true } },
                project: { select: { id: true, name: true, location: true, status: true } }
            }
        });
        res.status(200).json({ message: `Appointment status updated to ${newStatusEnum}`, appointment: updatedAppointment });
    } catch (error) {
        console.error("Update Appointment Status Error:", error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: "Appointment not found (already deleted or invalid ID)." });
        }
        next(error);
    }
};
