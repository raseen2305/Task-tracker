import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';

const USER_SELECT = {
  id: true, email: true, name: true, role: true,
  avatarUrl: true, isActive: true, createdAt: true,
};

export async function listUsers(req, res, next) {
  try {
    const { role, search } = req.query;
    const users = await prisma.user.findMany({
      where: {
        ...(role && { role }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        ...USER_SELECT,
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, ahtSeconds: true, createdAt: true },
        },
      },
    });
    if (!user) return next(createError(404, 'User not found'));
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { name, avatarUrl, role, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: USER_SELECT,
    });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function deactivateUser(req, res, next) {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
}
