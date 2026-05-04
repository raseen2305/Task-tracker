import { validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';

const PROJECT_INCLUDE = {
  lead:    { select: { id: true, name: true, email: true } },
  qr:      { select: { id: true, name: true, email: true } },
  members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
  _count:  { select: { tasks: true } },
};

// ── Tasker self-onboarding ────────────────────────────────────────────────────
export async function joinProject(req, res, next) {
  try {
    const { leadId, qrId } = req.body;
    const takerId = req.user.id;

    const [lead, qr] = await Promise.all([
      prisma.user.findUnique({ where: { id: leadId }, select: { id: true, name: true, role: true } }),
      prisma.user.findUnique({ where: { id: qrId },   select: { id: true, name: true, role: true } }),
    ]);

    if (!lead || lead.role !== 'PROJECT_LEAD')     return next(createError(400, 'Invalid Project Lead'));
    if (!qr   || qr.role   !== 'QUALITY_REVIEWER') return next(createError(400, 'Invalid Quality Reviewer'));

    // Find existing ACTIVE project for this PL+QR combo, or create one
    let project = await prisma.project.findFirst({
      where: { leadId, qrId, status: 'ACTIVE' },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name:            `${lead.name} / ${qr.name} — Batch`,
          description:     `Auto-created workspace for taskers under ${lead.name} (PL) and ${qr.name} (QR).`,
          status:          'ACTIVE',
          expectedAhtSecs: 300,
          leadId,
          qrId,
        },
      });
    }

    // Add tasker as member (idempotent)
    await prisma.projectMember.upsert({
      where:  { userId_projectId: { userId: takerId, projectId: project.id } },
      update: {},
      create: { userId: takerId, projectId: project.id },
    });

    const full = await prisma.project.findUnique({
      where: { id: project.id },
      include: PROJECT_INCLUDE,
    });

    res.json({ success: true, project: full });
  } catch (err) {
    next(err);
  }
}

// ── List projects (role-scoped) ───────────────────────────────────────────────
export async function listProjects(req, res, next) {
  try {
    const { role, id: userId } = req.user;

    let where = {};
    if (role === 'TAKER')            where = { members: { some: { userId } } };
    if (role === 'QUALITY_REVIEWER') where = { qrId: userId };
    if (role === 'PROJECT_LEAD')     where = { leadId: userId };

    const projects = await prisma.project.findMany({
      where,
      include: PROJECT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, projects });
  } catch (err) {
    next(err);
  }
}

// ── Get single project ────────────────────────────────────────────────────────
export async function getProject(req, res, next) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        ...PROJECT_INCLUDE,
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { taker: { select: { id: true, name: true } } },
        },
      },
    });
    if (!project) return next(createError(404, 'Project not found'));
    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

// ── Create project ────────────────────────────────────────────────────────────
export async function createProject(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError(400, errors.array()[0].msg));

    const { name, description, expectedAhtSecs } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        expectedAhtSecs: expectedAhtSecs || 300,
        leadId: req.user.id,
        ...(req.body.qrId && { qrId: req.body.qrId }),
      },
      include: PROJECT_INCLUDE,
    });

    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

// ── Update project ────────────────────────────────────────────────────────────
export async function updateProject(req, res, next) {
  try {
    const { name, description, status, expectedAhtSecs } = req.body;

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(expectedAhtSecs && { expectedAhtSecs }),
      },
      include: PROJECT_INCLUDE,
    });

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

// ── Assign QR + taskers to project ───────────────────────────────────────────
export async function assignMembers(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError(400, errors.array()[0].msg));

    const { qrId, taskerIds = [] } = req.body;
    const projectId = req.params.id;

    const updates = [];

    if (qrId !== undefined) {
      updates.push(prisma.project.update({ where: { id: projectId }, data: { qrId } }));
    }

    for (const userId of taskerIds) {
      updates.push(
        prisma.projectMember.upsert({
          where:  { userId_projectId: { userId, projectId } },
          update: {},
          create: { userId, projectId },
        })
      );
    }

    await prisma.$transaction(updates);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: PROJECT_INCLUDE,
    });

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
}
