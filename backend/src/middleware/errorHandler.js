/**
 * Central error handler middleware.
 * Formats all thrown errors into a consistent JSON response.
 */
export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${status} – ${message}`, err.stack);
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

/**
 * Creates a structured HTTP error.
 */
export function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
