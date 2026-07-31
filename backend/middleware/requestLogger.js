/**
 * middleware/requestLogger.js
 *
 * A lightweight request logger for development.
 * In production you would replace this with a structured logger (e.g. Winston)
 * that writes JSON logs to stdout for cloud log aggregation.
 */

function requestLogger(req, _res, next) {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
}

module.exports = requestLogger;
