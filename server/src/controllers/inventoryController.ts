import { Request, Response } from 'express';
import { prisma } from '../database/db.js';

export class InventoryController {
  static async list(req: Request, res: Response) {
    const { search, lowStockOnly, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.product = {
        OR: [
          { name: { contains: String(search) } },
          { sku: { contains: String(search) } },
        ],
      };
    }

    if (lowStockOnly === 'true') {
      where.availableQuantity = {
        lte: prisma.inventoryItem.fields.reorderThreshold,
      };
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          product: {
            include: {
              restockRequests: {
                orderBy: { createdAt: 'desc' },
                take: 5,
              },
            },
          },
        },
        orderBy: { availableQuantity: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return res.json({
      items,
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
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            restockRequests: { orderBy: { createdAt: 'desc' } },
            orders: { take: 5, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    return res.json({ item });
  }
}

