import { Request, Response } from 'express';
import { prisma } from '../database/db.js';

export class DashboardController {
  static async getSummary(req: Request, res: Response) {
    const now = new Date();

    const [
      activeWorkflows,
      completedWorkflows,
      awaitingApprovalWorkflows,
      failedWorkflows,
      delayedOrdersCount,
      totalOrders,
      lowStockItemsCount,
      allCompletedWorkflows,
      recentExecutions,
      highPriorityDelayedOrders,
      pendingApprovals,
    ] = await Promise.all([
      prisma.workflow.count({
        where: { status: { in: ['INVESTIGATING', 'PLANNING', 'VALIDATING', 'EXECUTING'] } },
      }),
      prisma.workflow.count({ where: { status: 'COMPLETED' } }),
      prisma.workflow.count({ where: { status: 'AWAITING_APPROVAL' } }),
      prisma.workflow.count({ where: { status: 'FAILED' } }),
      prisma.order.count({
        where: {
          OR: [
            { status: 'DELAYED' },
            { expectedDeliveryDate: { lt: now }, status: { in: ['PENDING', 'PROCESSING'] } },
          ],
        },
      }),
      prisma.order.count(),
      prisma.inventoryItem.count({
        where: { availableQuantity: { lte: prisma.inventoryItem.fields.reorderThreshold } },
      }),
      prisma.workflow.findMany({
        where: { status: 'COMPLETED', startedAt: { not: null }, completedAt: { not: null } },
        select: { startedAt: true, completedAt: true },
      }),
      prisma.workflow.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { creator: { select: { name: true, email: true } }, steps: true },
      }),
      prisma.order.findMany({
        where: {
          OR: [
            { status: 'DELAYED' },
            { expectedDeliveryDate: { lt: now }, status: { in: ['PENDING', 'PROCESSING'] } },
          ],
        },
        include: { product: true, shipment: true },
        orderBy: [{ priority: 'desc' }, { delayDays: 'desc' }],
        take: 5,
      }),
      prisma.approvalRequest.findMany({
        where: { status: 'PENDING' },
        include: { workflow: { select: { id: true, title: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Calculate average completion time in seconds
    let avgCompletionTimeSeconds = 0;
    if (allCompletedWorkflows.length > 0) {
      const totalSeconds = allCompletedWorkflows.reduce((acc, w) => {
        if (w.startedAt && w.completedAt) {
          return acc + (w.completedAt.getTime() - w.startedAt.getTime()) / 1000;
        }
        return acc;
      }, 0);
      avgCompletionTimeSeconds = Math.round(totalSeconds / allCompletedWorkflows.length);
    }

    // Status distribution
    const statusCounts = await prisma.workflow.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const workflowStatusDistribution = statusCounts.map((s) => ({
      name: s.status.replace(/_/g, ' '),
      value: s._count.status,
    }));

    // Activity trends for past 7 days
    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const activityTrends = await Promise.all(
      past7Days.map(async (dayDate) => {
        const nextDay = new Date(dayDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const created = await prisma.workflow.count({
          where: { createdAt: { gte: dayDate, lt: nextDay } },
        });
        const completed = await prisma.workflow.count({
          where: { completedAt: { gte: dayDate, lt: nextDay } },
        });

        return {
          date: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          created,
          completed,
        };
      })
    );

    return res.json({
      activeWorkflows,
      completedWorkflows,
      awaitingApprovalWorkflows,
      failedWorkflows,
      delayedOrdersCount,
      avgCompletionTimeSeconds,
      totalOrders,
      lowStockItemsCount,
      workflowStatusDistribution,
      activityTrends,
      recentExecutions,
      highPriorityDelayedOrders,
      pendingApprovals,
    });
  }
}

