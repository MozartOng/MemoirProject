// src/controllers/appointment.controller.js
const { PrismaClient, VisitReason, WorkshopDetail, AppointmentStatus } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
// Ensure date-fns is installed: npm install date-fns
const { parse } = require('date-fns'); // Import the parse function

// --- Helper Functions ---

// Map frontend visit reason string to Prisma Enum
const mapVisitReasonToEnum = (reasonString) => {
    const map = {
        'other': VisitReason.OTHER,
        'file': VisitReason.FILE,
        'workshop': VisitReason.WORKSHOP
    };
    return map[reasonString?.toLowerCase()]; // Use lowercase for safety
};

// Map frontend workshop detail string to Prisma Enum
const mapWorkshopDetailToEnum = (detailString) => {
    const map = {
        'reexecution': WorkshopDetail.REEXECUTION,
        'concreteTesting': WorkshopDetail.CONCRETE_TESTING,
        'concreteWorks': WorkshopDetail.CONCRETE_WORKS,
        'soil': WorkshopDetail.SOIL,
        'notSpecified': WorkshopDetail.NOT_SPECIFIED
        // Ensure frontend values match these keys exactly
    };
    return map[detailString];
};

// Map frontend status string to Prisma Enum (or 'all' for filtering)
const mapStatusToEnum = (statusString) => {
     const map = {
        'pending': AppointmentStatus.PENDING,
        'confirmed': AppointmentStatus.CONFIRMED,
        'rejected': AppointmentStatus.REJECTED, // Added based on potential admin actions
        'completed': AppointmentStatus.COMPLETED,
        'postponed': AppointmentStatus.POSTPONED
    };
    // Allow 'all' for filtering, handle it separately in calling functions
    const lowerStatus = statusString?.toLowerCase();
    return lowerStatus === 'all' ? 'all' : map[lowerStatus];
};


// --- Function to parse dd/MM/yyyy date and HH:mm time ---
// Parses the date string strictly assuming dd/MM/yyyy format.
const parseAndCombineDateTime_DDMMYYYY = (dateStr_ddmmyyyy, timeStr_hhmm) => {
    if (!dateStr_ddmmyyyy || !timeStr_hhmm) {
        console.error('parseAndCombineDateTime_DDMMYYYY: Missing date or time string.');
        return null;
    }
    try {
        const combinedStr = `${dateStr_ddmmyyyy} ${timeStr_hhmm}`;
        const formatString = 'dd/MM/yyyy HH:mm'; // The format WE EXPECT from the frontend
        // Parse using date-fns. Needs the exact format string.
        const parsedDateTime = parse(combinedStr, formatString, new Date());

        // Check if the parsed date is valid (e.g., not 31/02/2025)
        if (isNaN(parsedDateTime.getTime())) {
            console.error(`parseAndCombineDateTime_DDMMYYYY: Failed to parse date string "${combinedStr}" with format "${formatString}". Check if frontend sent the correct format.`);
            return null; // Parsing failed
        }
        console.log(`parseAndCombineDateTime_DDMMYYYY: Parsed "${combinedStr}" to Date:`, parsedDateTime);
        return parsedDateTime; // Return the valid JavaScript Date object
    } catch (e) {
        console.error("Error parsing dd/MM/yyyy date/time:", e);
        return null;
    }
};


// --- Controller Methods ---

// Create Appointment Endpoint
exports.createAppointment = async (req, res, next) => {
    const {
        projectName, projectLocation, visitReason: visitReasonStr,
        workshopDetail: workshopDetailStr, visitDesc,
        // EXPECTING 'date' in 'dd/mm/yyyy' format
        date,
        time
    } = req.body;
    const userId = req.user.id; // Assumes authenticateToken middleware adds req.user

    // Basic validation
    if (!projectName || !projectLocation || !visitReasonStr || !visitDesc || !date || !time) {
        return res.status(400).json({ message: 'Missing required appointment fields.' });
    }

    const visitReason = mapVisitReasonToEnum(visitReasonStr);
    if (!visitReason) {
        return res.status(400).json({ message: 'Invalid visit reason provided.' });
    }

    let workshopDetail = null;
    if (visitReason === VisitReason.WORKSHOP) {
        if (!workshopDetailStr || workshopDetailStr === 'none') {
            return res.status(400).json({ message: 'Workshop detail is required for workshop visits.' });
        }
        workshopDetail = mapWorkshopDetailToEnum(workshopDetailStr);
        if (!workshopDetail) {
            return res.status(400).json({ message: 'Invalid workshop detail provided.' });
        }
    }

    // --- Use the correct parsing function ---
    const proposedDateTime = parseAndCombineDateTime_DDMMYYYY(date, time);
    if (!proposedDateTime) {
         // Parsing failed
         return res.status(400).json({ message: 'Invalid date or time format. Backend expects dd/mm/yyyy and hh:mm.' });
    }
    // ---

    // File Handling
    const uploadedFiles = req.files; // From multer middleware
    const filesToCreate = [];
    if (uploadedFiles) {
        for (const fieldName in uploadedFiles) {
            uploadedFiles[fieldName].forEach(file => {
                // Store path relative to the 'uploads' directory accessed by the server
                filesToCreate.push({
                    filePath: path.relative(path.join(__dirname, '../../uploads'), file.path),
                    originalName: file.originalname,
                    fileType: fieldName,
                });
            });
        }
    }
    // Note: Add validation here if specific files are MANDATORY for certain workshopDetail types

    // Database Operation
    try {
        const newAppointment = await prisma.appointment.create({
            data: {
                userId,
                projectName,
                projectLocation,
                visitReason,
                workshopDetail, // Null if not applicable
                visitDesc,
                proposedDateTime, // The parsed Date object
                status: AppointmentStatus.PENDING, // Default status
                // Conditionally create related file records
                files: filesToCreate.length > 0 ? { create: filesToCreate } : undefined
            },
            include: { files: true } // Include created files in the response
        });
        res.status(201).json({ message: 'Appointment created successfully', appointment: newAppointment });
    } catch (error) {
        // Let the global error handler manage database errors, etc.
        next(error);
    }
};

// --- Admin Postpone Endpoint ---
// Handles postponing an appointment, expects date in dd/mm/yyyy
exports.postponeAppointmentAdmin = async (req, res, next) => {
    const { id } = req.params;
    // EXPECTING 'newDate' in 'dd/mm/yyyy' format
    const { newDate, newTime } = req.body;

    if (!newDate || !newTime) {
         return res.status(400).json({ message: 'New date (dd/mm/yyyy) and time (hh:mm) are required.' });
    }

    // --- Use the correct parsing function ---
    const newProposedDateTime = parseAndCombineDateTime_DDMMYYYY(newDate, newTime);
    if (!newProposedDateTime) {
        // Parsing failed
        return res.status(400).json({ message: 'Invalid new date or time format. Backend expects dd/mm/yyyy and hh:mm.' });
    }
    // ---

    try {
        const updatedAppointment = await prisma.appointment.update({
            where: { id: parseInt(id) },
            data: {
                proposedDateTime: newProposedDateTime, // Update with the parsed Date object
                status: AppointmentStatus.POSTPONED // Explicitly set status
            },
             // Include details needed by the frontend after update
             include: {
                user: { select: { id: true, fullName: true, companyName: true } },
                files: { select: { id: true, originalName: true, fileType: true, filePath: true } }
            }
        });
        res.status(200).json({ message: 'Appointment postponed successfully', appointment: updatedAppointment });
    } catch (error) {
        next(error); // Handle errors (e.g., appointment not found)
    }
};


// --- Get User's Appointments ---
// Retrieves appointments for the logged-in user, supports status filtering
exports.getUserAppointments = async (req, res, next) => {
    const userId = req.user.id; // From authenticateToken middleware
    const statusFilterStr = req.query.status; // Status from query param (e.g., 'pending')

    const whereClause = { userId }; // Base filter: only user's appointments

    // Apply status filter if provided and valid
    if (statusFilterStr && statusFilterStr !== 'all') {
        const statusEnum = mapStatusToEnum(statusFilterStr);
        if (statusEnum && statusEnum !== 'all') { // Ensure it's a valid enum value
             whereClause.status = statusEnum;
        } else {
            // Invalid status value provided
            return res.status(400).json({ message: `Invalid status filter: ${statusFilterStr}` });
        }
    }

    try {
        const appointments = await prisma.appointment.findMany({
            where: whereClause,
            orderBy: {
                proposedDateTime: 'asc' // Order by proposed date
            },
            include: {
                // Include file details for display
                files: {
                     select: { id: true, originalName: true, fileType: true, filePath: true }
                }
                // Do NOT include user here unless needed, as it's the user themselves
            }
        });
        res.status(200).json(appointments);
    } catch (error) {
        next(error);
    }
};

// --- Admin: Get All Appointments ---
// Retrieves all appointments, supports status filtering
exports.getAllAppointmentsAdmin = async (req, res, next) => {
    // Admin role check should be handled by middleware on the route
    const statusFilterStr = req.query.status;

    const whereClause = {}; // No initial user filter for admin

    // Apply status filter if provided and valid
    if (statusFilterStr && statusFilterStr !== 'all') {
        const statusEnum = mapStatusToEnum(statusFilterStr);
        if (statusEnum && statusEnum !== 'all') {
             whereClause.status = statusEnum;
        } else {
             return res.status(400).json({ message: `Invalid status filter: ${statusFilterStr}` });
        }
    }

    try {
        const appointments = await prisma.appointment.findMany({
            where: whereClause,
            orderBy: {
                proposedDateTime: 'asc'
            },
             include: {
                // Include basic user info for the admin list
                user: {
                    select: { id: true, fullName: true, companyName: true }
                },
                // Include files
                files: {
                     select: { id: true, originalName: true, fileType: true, filePath: true }
                }
            }
        });
        res.status(200).json(appointments);
    } catch (error) {
        next(error);
    }
};

// --- Admin: Update Appointment Status ---
// Updates status to confirmed, rejected, or completed
exports.updateAppointmentStatusAdmin = async (req, res, next) => {
    const { id } = req.params; // Appointment ID from URL
    const { status: statusStr } = req.body; // New status from request body

    if (!statusStr) {
        return res.status(400).json({ message: 'New status is required.' });
    }

    const newStatus = mapStatusToEnum(statusStr);

    // Validate the new status for this specific action
    if (!newStatus || newStatus === AppointmentStatus.PENDING || newStatus === AppointmentStatus.POSTPONED || newStatus === 'all') {
         return res.status(400).json({ message: `Invalid status provided for this update action: ${statusStr}. Use 'confirmed', 'rejected', or 'completed'.` });
    }

    try {
        const updatedAppointment = await prisma.appointment.update({
            where: { id: parseInt(id) },
            data: { status: newStatus }, // Update the status field
             include: {
                // Include data needed by frontend after update
                user: { select: { id: true, fullName: true, companyName: true } },
                files: { select: { id: true, originalName: true, fileType: true, filePath: true } }
            }
        });
        res.status(200).json({ message: `Appointment status updated to ${newStatus}`, appointment: updatedAppointment });
    } catch (error) {
        // Handles errors like record not found (Prisma's P2025) via global handler
        next(error);
    }
};

// --- Removed the duplicate, incorrect postponeAppointmentAdmin function ---