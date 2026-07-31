/**
 * middleware/asyncHandler.js
 *
 * Wraps async route handlers so we don't need try/catch in every controller.
 * Any rejected promise is forwarded to the global error handler automatically.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
