import prisma from '../lib/prisma.js';

/**
 * AHT Report – aggregated per user, per project, per day.
 * Accessible by CEO, HR, Project Lead.
 */
export async function getAhtReport(req, res, next) {
  try {
    const { projectId, userId, days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    const where = {
      submittedAt: { gte: since },
      ahtSeconds: { not: null },
      ...(projectId && { projectId }),
      ...(userId && { takerId: userId }),
    };

    // Raw aggregation per taker
    const perTaker = await prisma.task.groupBy({
      by: ['takerId'],
      where,
      _avg: { ahtSeconds: true },
      _count: { id: true },
      _min: { ahtSeconds: true },
      _max: { ahtSeconds: true },
    });

    // Enrich with user names
    const takerIds = perTaker.map((r) => r.takerId);
    const users = await prisma.user.findMany({
      where: { id: { in: takerIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const report = perTaker.map((r) => ({
      taker: userMap[r.takerId] || { id: r.takerId },
      avgAhtSeconds: Math.round(r._avg.ahtSeconds || 0),
      taskCount: r._count.id,
      minAhtSeconds: r._min.ahtSeconds,
      maxAhtSeconds: r._max.ahtSeconds,
    }));

    // Overall stats
    const overall = await prisma.task.aggregate({
      where,
      _avg: { ahtSeconds: true },
      _count: { id: true },
    });

    // Status breakdown
    const statusBreakdown = await prisma.task.groupBy({
      by: ['status'],
      where: { createdAt: { gte: since }, ...(projectId && { projectId }) },
      _count: { id: true },
    });

    res.json({
      success: true,
      report,
      overall: {
        avgAhtSeconds: Math.round(overall._avg.ahtSeconds || 0),
        totalTasks: overall._count.id,
      },
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Dashboard stats – role-aware summary cards.
 */
export async function getDashboardStats(req, res, next) {
  try {
    const { role, id: userId } = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let taskWhere = {};
    if (role === 'TAKER') taskWhere = { takerId: userId };
    if (role === 'QUALITY_REVIEWER') taskWhere = { project: { qrId: userId } };
    if (role === 'PROJECT_LEAD') taskWhere = { project: { leadId: userId } };

    const [totalTasks, todayTasks, pendingReview, overdueCount, projectCount] =
      await Promise.all([
        prisma.task.count({ where: taskWhere }),
        prisma.task.count({ where: { ...taskWhere, createdAt: { gte: today } } }),
        prisma.task.count({ where: { ...taskWhere, status: 'SUBMITTED' } }),
        prisma.task.count({ where: { ...taskWhere, isOverdue: true } }),
        role === 'TAKER'
          ? prisma.projectMember.count({ where: { userId } })
          : prisma.project.count({
              where:
                role === 'PROJECT_LEAD'
                  ? { leadId: userId }
                  : role === 'QUALITY_REVIEWER'
                  ? { qrId: userId }
                  : {},
            }),
      ]);

    res.json({
      success: true,
      stats: { totalTasks, todayTasks, pendingReview, overdueCount, projectCount },
    });
  } catch (err) {
    next(err);
  }
}
