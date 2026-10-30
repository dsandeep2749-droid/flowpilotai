import { Request, Response } from 'express';
import { prisma } from '../database/db.js';

export class OrderController {
  static async list(req: Request, res: Response) {
    const { search, status, priority, delayedOnly, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: String(search) } },
        { customerName: { contains: String(search) } },
        { customerEmail: { contains: String(search) } },
        { product: { name: { contains: String(search) } } },
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (delayedOnly === 'true') {
      const now = new Date();
      where.OR = [
        { status: 'DELAYED' },
        { expectedDeliveryDate: { lt: now }, status: { in: ['PENDING', 'PROCESSING'] } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          product: { include: { inventoryItem: true } },
          shipment: true,
          shipmentInvestigations: true,
        },
        orderBy: [{ priority: 'desc' }, { delayDays: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    return res.json({
      orders,
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
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: { include: { inventoryItem: true } },
        shipment: true,
        shipmentInvestigations: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ order });
  }
}

