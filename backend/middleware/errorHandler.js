/**
 * middleware/errorHandler.js — Centralized Error Handler
 *
 * Why centralise error handling?
 *   Controllers throw errors; this single middleware catches them all.
 *   Every error response has the same JSON shape, making it easy for the
 *   frontend to parse and display errors consistently.
 *
 * Error shape:
 *   { success: false, message: string, ...(stack in dev) }
 */

function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal Server Error';

  // Log the full error on the server side
  console.error(`[ERROR] ${statusCode} — ${message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack traces in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
