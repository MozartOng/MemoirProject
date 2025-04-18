// controllers/appointmentController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

// Create a new appointment with file uploads
const createAppointment = async (req, res, next) => {
  try {
    const {
      appointment_date,
      appointment_time,
      project_name,
      project_location,
      visit_reason,
      visit_description,
      workshop_detail,
    } = req.body;

    const userId = req.user.id;

    if (
      !appointment_date ||
      !appointment_time ||
      !project_name ||
      !project_location ||
      !visit_reason ||
      !visit_description
    ) {
      const error = new Error('All required fields must be provided');
      error.status = 400;
      throw error;
    }

    // Validate visit_reason
    const validVisitReasons = ['none', 'other', 'file', 'workshop'];
    if (!validVisitReasons.includes(visit_reason)) {
      const error = new Error('Invalid visit reason');
      error.status = 400;
      throw error;
    }

    // Validate workshop_detail if visit_reason is 'workshop'
    if (visit_reason === 'workshop') {
      const validWorkshopDetails = [
        'none',
        'reexecution',
        'concreteTesting',
        'concreteWorks',
        'soil',
        'notSpecified',
      ];
      if (!workshop_detail || !validWorkshopDetails.includes(workshop_detail)) {
        const error = new Error('Invalid workshop detail');
        error.status = 400;
        throw error;
      }
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        user_id: userId,
        appointment_date: new Date(appointment_date),
        appointment_time,
        project_name,
        project_location,
        visit_reason,
        visit_description,
        workshop_detail: visit_reason === 'workshop' ? workshop_detail : null,
      },
    });

    // Handle file uploads
    const files = req.files || {};
    const fileEntries = [];

    // General files (for "file" or "other" visit reasons)
    if (files.files) {
      files.files.forEach(file => {
        fileEntries.push({
          appointment_id: appointment.id,
          file_path: file.path,
          file_type: 'general',
        });
      });
    }

    // Workshop-specific files (for contractors with "workshop" visit reason)
    if (visit_reason === 'workshop' && workshop_detail) {
      const workshopFileFields = {
        reexecution: ['excavationPhotos', 'engineerReport', 'concreteStudy'],
        concreteTesting: ['currentWorkPhotos', 'workAcceptanceReport', 'concreteResults'],
        concreteWorks: ['sitePhotos', 'formworkAcceptanceReport'],
        soil: ['sitePhotoTemporary', 'ownerInvitationTemporary'],
        notSpecified: ['temporaryAcceptanceCopy', 'ownerInvitationFinal'],
      };

      const requiredFields = workshopFileFields[workshop_detail] || [];
      for (const field of requiredFields) {
        if (files[field] && files[field][0]) {
          fileEntries.push({
            appointment_id: appointment.id,
            file_path: files[field][0].path,
            file_type: field,
          });
        } else {
          // If a required file is missing, throw an error
          const error = new Error(`Missing required file: ${field}`);
          error.status = 400;
          throw error;
        }
      }
    }

    // Save file entries to the database
    if (fileEntries.length > 0) {
      await prisma.file.createMany({
        data: fileEntries,
      });
    }

    res.status(201).json({ message: 'Appointment created successfully', appointment });
  } catch (error) {
    next(error);
  }
};

// Existing getMyAppointments function
const getMyAppointments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const appointments = await prisma.appointment.findMany({
      where: { user_id: userId },
      include: {
        files: true, // Include files in the response
      },
    });

    res.status(200).json(appointments);
  } catch (error) {
    next(error);
  }
};

// Existing getAppointments function (admin-only)
const getAppointments = async (req, res, next) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        user: {
          select: { full_name: true, email: true },
        },
        files: true, // Include files in the response
      },
    });

    res.status(200).json(appointments);
  } catch (error) {
    next(error);
  }
};

// Existing updateAppointment function (admin-only)
const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, new_date, new_time } = req.body;

    if (!status) {
      const error = new Error('Status is required');
      error.status = 400;
      throw error;
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'rejected', 'postponed'];
    if (!validStatuses.includes(status)) {
      const error = new Error('Invalid status');
      error.status = 400;
      throw error;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!appointment) {
      const error = new Error('Appointment not found');
      error.status = 404;
      throw error;
    }

    const updateData = { status };
    if (status === 'postponed') {
      if (!new_date || !new_time) {
        const error = new Error('New date and time are required for postponement');
        error.status = 400;
        throw error;
      }
      updateData.appointment_date = new Date(new_date);
      updateData.appointment_time = new_time;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    await prisma.appointmentHistory.create({
      data: {
        appointment_id: parseInt(id),
        admin_id: req.user.id,
        previous_status: appointment.status,
        new_status: status,
      },
    });

    res.status(200).json({
      message: `Appointment status updated to ${status}`,
      appointment: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointments,
  updateAppointment,
};