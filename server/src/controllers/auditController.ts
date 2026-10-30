import { Request, Response } from 'express';
import { prisma } from '../database/db.js';

export class AuditController {
  static async list(req: Request, res: Response) {
    const { eventType, actorEmail, workflowId, outcome, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (eventType && eventType !== 'ALL') {
      where.eventType = String(eventType);
    }
    if (actorEmail) {
      where.actorEmail = { contains: String(actorEmail) };
    }
    if (workflowId) {
      where.workflowId = String(workflowId);
    }
    if (outcome && outcome !== 'ALL') {
      where.outcome = String(outcome);
    }

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return res.json({
      events,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  }
}

