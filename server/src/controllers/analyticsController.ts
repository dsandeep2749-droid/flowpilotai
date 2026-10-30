import { Request, Response } from 'express';
import { prisma } from '../database/db.js';

export class AnalyticsController {
  static async getSummary(req: Request, res: Response) {
    const [
      totalWorkflows,
      completedWorkflows,
      failedWorkflows,
      allSteps,
      allApprovals,
      recoveryEvents,
    ] = await Promise.all([
      prisma.workflow.count(),
      prisma.workflow.count({ where: { status: 'COMPLETED' } }),
      prisma.workflow.count({ where: { status: 'FAILED' } }),
      prisma.workflowStep.findMany({
        select: {
          stepType: true,
          status: true,
          verificationStatus: true,
          retryCount: true,
        },
      }),
      prisma.approvalRequest.findMany({
        select: {
          status: true,
          createdAt: true,
          decisionAt: true,
        },
      }),
      prisma.auditEvent.count({
        where: { eventType: { in: ['RECOVERY_ATTEMPTED', 'RECOVERY_COMPLETED'] } },
      }),
    ]);

    const successRate = totalWorkflows > 0 ? Math.round((completedWorkflows / totalWorkflows) * 100) : 0;
    const failureRate = totalWorkflows > 0 ? Math.round((failedWorkflows / totalWorkflows) * 100) : 0;

    // Verified vs unverified outcomes
    const verifiedCount = allSteps.filter((s) => s.verificationStatus === 'VERIFIED').length;
    const unverifiedCount = allSteps.filter((s) => s.verificationStatus === 'UNVERIFIED').length;
    const failedVerificationCount = allSteps.filter((s) => s.verificationStatus === 'FAILED').length;

    // Turnaround time for approvals
    const resolvedApprovals = allApprovals.filter((a) => a.decisionAt !== null);
    let avgApprovalTurnaroundMinutes = 0;
    if (resolvedApprovals.length > 0) {
      const totalMinutes = resolvedApprovals.reduce((acc, a) => {
        return acc + (a.decisionAt!.getTime() - a.createdAt.getTime()) / (1000 * 60);
      }, 0);
      avgApprovalTurnaroundMinutes = Math.round(totalMinutes / resolvedApprovals.length);
    }

    // Step type distribution
    const stepTypeCounts: Record<string, number> = {};
    for (const step of allSteps) {
      stepTypeCounts[step.stepType] = (stepTypeCounts[step.stepType] || 0) + 1;
    }
    const stepDistribution = Object.entries(stepTypeCounts).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value,
    }));

    return res.json({
      totalWorkflows,
      completedWorkflows,
      failedWorkflows,
      successRate,
      failureRate,
      verificationStats: {
        verified: verifiedCount,
        unverified: unverifiedCount,
        failed: failedVerificationCount,
        verificationRate: allSteps.length > 0 ? Math.round((verifiedCount / allSteps.length) * 100) : 0,
      },
      approvals: {
        total: allApprovals.length,
        approved: allApprovals.filter((a) => a.status === 'APPROVED').length,
        rejected: allApprovals.filter((a) => a.status === 'REJECTED').length,
        pending: allApprovals.filter((a) => a.status === 'PENDING').length,
        avgTurnaroundMinutes: avgApprovalTurnaroundMinutes,
      },
      recoveryMetrics: {
        recoveriesExecuted: recoveryEvents,
        autoRetriesTriggered: allSteps.reduce((acc, s) => acc + s.retryCount, 0),
      },
      stepDistribution,
    });
  }
}

