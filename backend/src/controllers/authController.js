import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Role → portal redirect path mapping.
 * The frontend uses this to route users to their specific portal.
 */
const ROLE_REDIRECT = {
  CEO: '/portal/hr',
  HR: '/portal/hr',
  PROJECT_LEAD: '/portal/lead',
  QUALITY_REVIEWER: '/portal/qr',
  TAKER: '/portal/taker',
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError(400, errors.array()[0].msg));

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return next(createError(401, 'Invalid credentials'));

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return next(createError(401, 'Invalid credentials'));

    const token = signToken(user);
    const redirect = ROLE_REDIRECT[user.role] || '/portal/taker';

    res.json({
      success: true,
      token,
      redirect,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError(400, errors.array()[0].msg));

    const { email, password, name, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(createError(409, 'Email already registered'));

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, name: true, role: true,
        avatarUrl: true, isActive: true, createdAt: true,
      },
    });
    if (!user) return next(createError(404, 'User not found'));
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}
