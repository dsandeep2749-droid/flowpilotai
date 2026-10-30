import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/db.js';
import { CoordinatorAgent } from '../agents/coordinatorAgent.js';
import { AuditService } from '../services/auditService.js';

const approveSchema = z.object({
  comment: z.string().optional(),
});

const rejectSchema = z.object({
  comment: z.string().min(3, 'Rejection reason is required'),
});

export class ApprovalController {
  static async list(req: Request, res: Response) {
    const { status = 'PENDING' } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const approvals = await prisma.approvalRequest.findMany({
      where,
      include: {
        workflow: {
          select: { id: true, title: true, status: true, objective: true },
        },
        requester: { select: { id: true, name: true, email: true, role: true } },
        approver: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ approvals });
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const approval = await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        workflow: {
          select: { id: true, title: true, status: true, objective: true },
        },
        requester: { select: { id: true, name: true, email: true, role: true } },
        approver: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    return res.json({ approval });
  }

  static async approve(req: Request, res: Response) {
    const { id } = req.params;
    const validated = approveSchema.parse(req.body);
    const user = req.user!;

    // Role verification: OPERATOR cannot approve
    if (user.role === 'OPERATOR') {
      return res.status(403).json({
        error: 'Forbidden. Operators cannot approve sensitive workflow actions. Manager or Admin role required.',
      });
    }

    const approval = await prisma.approvalRequest.findUnique({
      where: { id },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.status !== 'PENDING') {
      return res.status(400).json({
        error: `Cannot approve request with current status '${approval.status}'.`,
      });
    }

    // Update approval record
    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverId: user.id,
        decisionComment: validated.comment || 'Approved by manager',
        decisionAt: new Date(),
      },
    });

    await AuditService.log({
      eventType: 'APPROVAL_GRANTED',
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      workflowId: approval.workflowId,
      entityType: 'ApprovalRequest',
      entityId: id,
      details: {
        actionType: approval.actionType,
        comment: validated.comment,
      },
    });

    // Resume execution asynchronously
    CoordinatorAgent.resumeAfterApproval(id, user).catch((err) => {
      console.error(`[Coordinator Resume Error after approval ${id}]`, err);
    });

    return res.json({
      message: 'Action approved successfully. Workflow execution resumed.',
      approval: updated,
    });
  }

  static async reject(req: Request, res: Response) {
    const { id } = req.params;
    const validated = rejectSchema.parse(req.body);
    const user = req.user!;

    if (user.role === 'OPERATOR') {
      return res.status(403).json({
        error: 'Forbidden. Operators cannot reject or decide on approval requests.',
      });
    }

    const approval = await prisma.approvalRequest.findUnique({
      where: { id },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    if (approval.status !== 'PENDING') {
      return res.status(400).json({
        error: `Cannot reject request with current status '${approval.status}'.`,
      });
    }

    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approverId: user.id,
        decisionComment: validated.comment,
        decisionAt: new Date(),
      },
    });

    if (approval.stepId) {
      await prisma.workflowStep.update({
        where: { id: approval.stepId },
        data: {
          status: 'SKIPPED',
          errorMessage: `Action rejected by ${user.name}: ${validated.comment}`,
          completedAt: new Date(),
        },
      });
    }

    // Check if workflow has any other steps or complete it as partially completed
    await prisma.workflow.update({
      where: { id: approval.workflowId },
      data: {
        status: 'PARTIALLY_COMPLETED',
        finalSummary: `Action ${approval.actionType} was rejected by ${user.role}: "${validated.comment}". Workflow concluded.`,
        completedAt: new Date(),
      },
    });

    await AuditService.log({
      eventType: 'APPROVAL_REJECTED',
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      workflowId: approval.workflowId,
      entityType: 'ApprovalRequest',
      entityId: id,
      outcome: 'DENIED',
      details: {
        actionType: approval.actionType,
        reason: validated.comment,
      },
    });

    return res.json({
      message: 'Action rejected. Step skipped and workflow marked partially completed.',
      approval: updated,
    });
  }
}

