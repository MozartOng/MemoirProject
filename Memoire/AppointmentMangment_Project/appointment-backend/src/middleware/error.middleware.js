// src/middleware/error.middleware.js
const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err); // Log the error

  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation (e.g., duplicate email)
    if (err.code === 'P2002') {
      statusCode = 409; // Conflict
      message = `Unique constraint failed on the field(s): ${err.meta?.target?.join(', ')}`;
    }
    // Record not found
    else if (err.code === 'P2025') {
        statusCode = 404;
        message = err.meta?.cause || 'Record not found.';
    }
    // Add more specific Prisma error codes if needed
  } else if (err instanceof Prisma.PrismaClientValidationError) {
      statusCode = 400; // Bad Request
      message = 'Invalid input data.';
      // You could attempt to parse the validation error for more details,
      // but it can be complex. Keeping it generic is often sufficient.
  }
  // Handle Multer errors (e.g., file size limit)
  else if (err instanceof multer.MulterError) {
      statusCode = 400;
      if (err.code === 'LIMIT_FILE_SIZE') {
          message = 'File is too large.';
      } else {
          message = `File upload error: ${err.message}`;
      }
  }
  // Handle generic errors or specific application errors
  else if (err.status) { // If error has a status property
      statusCode = err.status;
      message = err.message;
  } else if (err.message.includes('File upload only supports')) { // Specific multer filter error
      statusCode = 400;
      message = err.message;
  }

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;