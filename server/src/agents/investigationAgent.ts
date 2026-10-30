import { ToolRegistry } from '../tools/toolRegistry.js';
import { prisma } from '../database/db.js';

export interface InvestigationResult {
  summary: string;
  delayedOrders: any[];
  lowStockItems: any[];
  shipmentIssues: any[];
  investigationDossier: Record<string, any>;
}

export class InvestigationAgent {
  static async investigate(workflowId: string): Promise<InvestigationResult> {
    // 1. Fetch delayed orders
    const delayedResult = await ToolRegistry.getDelayedOrders.execute(
      { limit: 20 },
      { workflowId }
    );
    const delayedOrders = delayedResult.data?.orders || [];

    // 2. Fetch low-stock inventory items
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        availableQuantity: { lte: prisma.inventoryItem.fields.reorderThreshold },
      },
      include: { product: true },
    });

    // 3. Inspect shipments with issues
    const shipmentIssues = await prisma.shipment.findMany({
      where: {
        status: { in: ['DELAYED', 'EXCEPTION', 'PENDING'] },
      },
      include: { order: true },
    });

    return {
      summary: `Investigated ${delayedOrders.length} delayed orders. Identified ${lowStockItems.length} inventory deficits and ${shipmentIssues.length} carrier exceptions.`,
      delayedOrders,
      lowStockItems,
      shipmentIssues,
      investigationDossier: {
        analyzedOrdersCount: delayedOrders.length,
        criticalCount: delayedOrders.filter((o: any) => o.priority === 'CRITICAL' || o.delayDays > 5).length,
        inventoryDeficitCount: lowStockItems.length,
        carrierExceptionCount: shipmentIssues.length,
      },
    };
  }
}

