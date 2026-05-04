import { validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';

const BATCH_INCLUDE = {
  qr: { select: { id: true, name: true, email: true } },
  members: {
    include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
    orderBy: { joinedAt: 'asc' },
  },
  _count: { select: { members: true } },
};

export async function getMyBatches(req, res, next) {
  try {
    const batches = await prisma.batch.findMany({
      where: { qrId: req.user.id },
      include: BATCH_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, batches });
  } catch (err) { next(err); }
}

export async function listBatches(req, res, next) {
  try {
    const batches = await prisma.batch.findMany({
      include: BATCH_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, batches });
  } catch (err) { next(err); }
}

export async function getBatch(req, res, next) {
  try {
    const batch = await prisma.batch.findUnique({
      where: { id: req.params.id },
      include: BATCH_INCLUDE,
    });
    if (!batch) return next(createError(404, 'Batch not found'));
    res.json({ success: true, batch });
  } catch (err) { next(err); }
}

export async function createBatch(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError(400, errors.array()[0].msg));

    const { name, qrId } = req.body;

    // Verify QR exists
    const qr = await prisma.user.findUnique({ where: { id: qrId } });
    if (!qr || qr.role !== 'QUALITY_REVIEWER') return next(createError(400, 'Invalid Quality Reviewer'));

    const batch = await prisma.batch.create({
      data: { name, qrId },
      include: BATCH_INCLUDE,
    });
    res.status(201).json({ success: true, batch });
  } catch (err) { next(err); }
}

export async function updateBatch(req, res, next) {
  try {
    const { name, qrId, isActive } = req.body;

    if (qrId) {
      const qr = await prisma.user.findUnique({ where: { id: qrId } });
      if (!qr || qr.role !== 'QUALITY_REVIEWER') return next(createError(400, 'Invalid Quality Reviewer'));
    }

    const batch = await prisma.batch.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(qrId !== undefined && { qrId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: BATCH_INCLUDE,
    });
    res.json({ success: true, batch });
  } catch (err) { next(err); }
}

export async function addMembers(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError(400, errors.array()[0].msg));

    const { userIds } = req.body;
    const batchId = req.params.id;

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return next(createError(404, 'Batch not found'));

    // Upsert all members
    await Promise.all(
      userIds.map((userId) =>
        prisma.batchMember.upsert({
          where:  { userId_batchId: { userId, batchId } },
          update: {},
          create: { userId, batchId },
        })
      )
    );

    const updated = await prisma.batch.findUnique({
      where: { id: batchId },
      include: BATCH_INCLUDE,
    });
    res.json({ success: true, batch: updated });
  } catch (err) { next(err); }
}

export async function removeMember(req, res, next) {
  try {
    await prisma.batchMember.deleteMany({
      where: { userId: req.params.userId, batchId: req.params.id },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function deleteBatch(req, res, next) {
  try {
    await prisma.batch.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
}
