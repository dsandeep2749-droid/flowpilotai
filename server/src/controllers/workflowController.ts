import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../database/db.js';
import { CoordinatorAgent } from '../agents/coordinatorAgent.js';
import { AuditService } from '../services/auditService.js';

const createWorkflowSchema = z.object({
  objective: z.string().min(5, 'Objective must be at least 5 characters'),
  title: z.string().optional(),
  executionMode: z.enum(['PLAN_ONLY', 'ASSISTED', 'AUTHORIZED_AUTOMATION']).default('ASSISTED'),
  workflowType: z.string().default('ORDER_DELAY_RESOLUTION'),
});

export class WorkflowController {
  static async create(req: Request, res: Response) {
    const validated = createWorkflowSchema.parse(req.body);
    const userId = req.user?.id;

    const workflow = await prisma.workflow.create({
      data: {
        title: validated.title || validated.objective.substring(0, 60),
        objective: validated.objective,
        executionMode: validated.executionMode,
        workflowType: validated.workflowType,
        creatorId: userId,
        status: 'QUEUED',
      },
    });

    await AuditService.log({
      eventType: 'WORKFLOW_CREATED',
      actorId: userId,
      actorEmail: req.user?.email,
      actorRole: req.user?.role,
      workflowId: workflow.id,
      details: { objective: workflow.objective, mode: workflow.executionMode },
    });

    // Run coordinator asynchronously so client gets immediate workflow record, but starts processing
    CoordinatorAgent.startWorkflow(workflow.id, req.user).catch((err) => {
      console.error(`[Coordinator Async Error for workflow ${workflow.id}]`, err);
    });

    return res.status(201).json({ workflow });
  }

  static async list(req: Request, res: Response) {
    const { status, mode, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (mode && mode !== 'ALL') {
      where.executionMode = mode;
    }

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true, role: true } },
          steps: { orderBy: { sequence: 'asc' } },
          approvals: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.workflow.count({ where }),
    ]);

    return res.json({
      workflows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }

  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
        steps: {
          orderBy: { sequence: 'asc' },
          include: { toolExecutions: true, approvalRequests: true },
        },
        approvals: {
          include: {
            requester: { select: { name: true, email: true } },
            approver: { select: { name: true, email: true } },
          },
        },
        toolExecutions: { orderBy: { createdAt: 'desc' } },
        auditEvents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    return res.json({ workflow });
  }

  static async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const workflow = await prisma.workflow.findUnique({ where: { id } });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(workflow.status)) {
      return res.status(400).json({ error: `Cannot cancel workflow in '${workflow.status}' state.` });
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: { status: 'CANCELLED', completedAt: new Date() },
    });

    await AuditService.log({
      eventType: 'WORKFLOW_CANCELLED',
      actorId: req.user?.id,
      workflowId: id,
      outcome: 'SUCCESS',
    });

    return res.json({ workflow: updated });
  }

  static async retry(req: Request, res: Response) {
    const { id } = req.params;
    const workflow = await prisma.workflow.findUnique({ where: { id } });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    if (workflow.status !== 'FAILED') {
      return res.status(400).json({ error: 'Only failed workflows can be retried.' });
    }

    // Reset status and restart
    await prisma.workflow.update({
      where: { id },
      data: {
        status: 'QUEUED',
        failureReason: null,
      },
    });

    await AuditService.log({
      eventType: 'WORKFLOW_RETRIED',
      actorId: req.user?.id,
      workflowId: id,
    });

    CoordinatorAgent.startWorkflow(id, req.user).catch((err) => {
      console.error(`[Coordinator Retry Error for ${id}]`, err);
    });

    return res.json({ message: 'Workflow retry initiated successfully' });
  }
}

