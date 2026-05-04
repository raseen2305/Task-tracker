import { validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import { runQC } from '../services/qcService.js';

// ── Tasker: Check if onboarded (has any project memberships) ─────────────────
export async function getOnboardingStatus(req, res, next) {
  try {
    const count = await prisma.projectMember.count({ where: { userId: req.user.id } });
    res.json({ success: true, onboarded: count > 0 });
  } catch (err) {
    next(err);
  }
}


export async function checkGrammar(req, res, next) {
  try {
    const { text } = req.body;
    const result = await runQC(text);
    res.json({
      success: true,
      score: result.score,
      passed: result.passed,
      skipped: result.skipped || false,
      issues: result.issues,
    });
  } catch (err) {
    next(err);
  }
}


export async function startTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError(400, errors.array()[0].msg));

    const { projectId } = req.body;
    const takerId = req.user.id;

    // Verify taker is a member of this project
    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: takerId, projectId } },
    });
    if (!membership) return next(createError(403, 'Not a member of this project'));

    // Check for already in-progress task
    const existing = await prisma.task.findFirst({
      where: { takerId, status: 'IN_PROGRESS' },
    });
    if (existing) {
      return res.json({ success: true, task: existing, resumed: true });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        takerId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

// ── Tasker: Submit a task ─────────────────────────────────────────────────────
export async function submitTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError(400, errors.array()[0].msg));

    const { taskId, response, prompt } = req.body;
    const takerId = req.user.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) return next(createError(404, 'Task not found'));
    if (task.takerId !== takerId) return next(createError(403, 'Not your task'));
    if (task.status !== 'IN_PROGRESS') return next(createError(400, 'Task is not in progress'));

    const submittedAt = new Date();
    const ahtSeconds = task.startedAt
      ? Math.round((submittedAt - task.startedAt) / 1000)
      : null;

    // Overdue check
    const isOverdue =
      ahtSeconds !== null && ahtSeconds > task.project.expectedAhtSecs * 2;

    // Run automated QC
    const qcResult = await runQC(response);

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        response,
        prompt,
        status: 'SUBMITTED',
        submittedAt,
        ahtSeconds,
        isOverdue,
        qcScore: qcResult.score,
        qcIssues: qcResult.issues,
        qcPassedAt: qcResult.passed ? new Date() : null,
      },
      include: { project: { select: { name: true } } },
    });

    res.json({
      success: true,
      task: updated,
      qc: {
        score: qcResult.score,
        passed: qcResult.passed,
        issueCount: qcResult.issues.length,
        skipped: qcResult.skipped || false,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Tasker: 5-day history ─────────────────────────────────────────────────────
export async function getTaskHistory(req, res, next) {
  try {
    // PL can pass ?takerId=xxx to view a specific tasker's history
    const takerId = req.user.role === 'TAKER'
      ? req.user.id
      : (req.query.takerId || req.user.id);

    const since = new Date();
    since.setDate(since.getDate() - 5);

    const tasks = await prisma.task.findMany({
      where: { takerId, createdAt: { gte: since } },
      include: {
        project: { select: { id: true, name: true } },
        feedback: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}

// ── Tasker: Feedback (rejected tasks) ────────────────────────────────────────
export async function getMyFeedback(req, res, next) {
  try {
    const takerId = req.user.id;

    const tasks = await prisma.task.findMany({
      where: { takerId, status: 'REJECTED' },
      include: {
        project: { select: { id: true, name: true } },
        feedback: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}

// ── PL: Reviewed tasks (approved + rejected) for QR monitoring ───────────────
export async function getReviewedTasks(req, res, next) {
  try {
    const { id: userId, role } = req.user;

    let projectWhere = {};
    if (role === 'PROJECT_LEAD') projectWhere = { leadId: userId };

    const tasks = await prisma.task.findMany({
      where: {
        status: { in: ['APPROVED', 'REJECTED'] },
        project: projectWhere,
      },
      include: {
        project:  { select: { id: true, name: true } },
        taker:    { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
        feedback: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}


export async function getSubmittedTasks(req, res, next) {
  try {
    const { id: userId, role } = req.user;

    // Build project filter based on role
    let projectWhere = {};
    if (role === 'QUALITY_REVIEWER') projectWhere = { qrId: userId };
    if (role === 'PROJECT_LEAD')     projectWhere = { leadId: userId };

    const tasks = await prisma.task.findMany({
      where: {
        status: 'SUBMITTED',
        project: projectWhere,
      },
      include: {
        project: { select: { id: true, name: true } },
        taker:   { select: { id: true, name: true, email: true } },
        feedback: true,
      },
      orderBy: { submittedAt: 'asc' }, // oldest first = FIFO queue
    });

    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}


export async function getTask(req, res, next) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        taker: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
        feedback: true,
      },
    });
    if (!task) return next(createError(404, 'Task not found'));
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

// ── QR: Approve task ──────────────────────────────────────────────────────────
export async function approveTask(req, res, next) {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return next(createError(404, 'Task not found'));
    if (task.status !== 'SUBMITTED') return next(createError(400, 'Task is not submitted'));

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', reviewerId: req.user.id },
    });

    res.json({ success: true, task: updated });
  } catch (err) {
    next(err);
  }
}

// ── QR: Reject task with feedback ─────────────────────────────────────────────
export async function rejectTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(createError(400, errors.array()[0].msg));

    const { comment, errorTags = [] } = req.body;
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return next(createError(404, 'Task not found'));
    if (task.status !== 'SUBMITTED') return next(createError(400, 'Task is not submitted'));

    const [updated] = await prisma.$transaction([
      prisma.task.update({
        where: { id: req.params.id },
        data: { status: 'REJECTED', reviewerId: req.user.id },
      }),
      prisma.feedback.create({
        data: {
          taskId: req.params.id,
          userId: req.user.id,
          comment,
          errorTags,
        },
      }),
    ]);

    res.json({ success: true, task: updated });
  } catch (err) {
    next(err);
  }
}
