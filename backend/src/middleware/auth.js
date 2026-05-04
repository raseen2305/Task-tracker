import jwt from 'jsonwebtoken';
import { createError } from './errorHandler.js';

/**
 * Verifies JWT and attaches decoded user to req.user.
 */
export function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(createError(401, 'No token provided'));
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    next(createError(401, 'Invalid or expired token'));
  }
}

/**
 * Role-based access control guard.
 * @param {...string} roles - Allowed roles
 */
export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(createError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(createError(403, 'Insufficient permissions'));
    }
    next();
  };
}
