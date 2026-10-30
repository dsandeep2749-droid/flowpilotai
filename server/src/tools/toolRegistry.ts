import { z } from 'zod';
import { prisma } from '../database/db.js';
import { AuditService } from '../services/auditService.js';

export interface ToolContext {
  userId?: string;
  userRole?: string;
  workflowId: string;
  stepId?: string;
  idempotencyKey?: string;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  isTransient?: boolean;
  verificationEvidence?: any;
}

// Global memory for simulated transient failures so they fail once, then succeed on retry!
const simulatedFailureMap = new Map<string, number>();

export const ToolRegistry = {
  // 1. getDelayedOrders
  getDelayedOrders: {
    description: 'Retrieve all orders that have passed their expected delivery date or are marked DELAYED',
    schema: z.object({
      limit: z.number().optional().default(50),
    }),
    execute: async (input: { limit?: number }, ctx: ToolContext): Promise<ToolResult> => {
      const now = new Date();
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { status: 'DELAYED' },
            { expectedDeliveryDate: { lt: now }, status: { in: ['PENDING', 'PROCESSING'] } },
          ],
        },
        include: {
          product: {
            include: { inventoryItem: true },
          },
          shipment: true,
        },
        take: input.limit || 50,
        orderBy: { expectedDeliveryDate: 'asc' },
      });

      return {
        success: true,
        data: {
          count: orders.length,
          orders,
        },
      };
    },
  },

  // 2. getOrderDetails
  getOrderDetails: {
    description: 'Retrieve full details for an individual order',
    schema: z.object({
      orderId: z.string(),
    }),
    execute: async (input: { orderId: string }, ctx: ToolContext): Promise<ToolResult> => {
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          product: { include: { inventoryItem: true } },
          shipment: true,
          shipmentInvestigations: true,
        },
      });

      if (!order) {
        return { success: false, error: `Order with ID ${input.orderId} not found.` };
      }

      return { success: true, data: order };
    },
  },

  // 3. getInventoryStatus
  getInventoryStatus: {
    description: 'Retrieve stock levels, reorder threshold, and supplier information for a product',
    schema: z.object({
      productId: z.string(),
    }),
    execute: async (input: { productId: string }, ctx: ToolContext): Promise<ToolResult> => {
      const inventory = await prisma.inventoryItem.findUnique({
        where: { productId: input.productId },
        include: { product: true },
      });

      if (!inventory) {
        return { success: false, error: `Inventory item for product ${input.productId} not found.` };
      }

      const isLowStock = inventory.availableQuantity <= inventory.reorderThreshold;

      return {
        success: true,
        data: {
          ...inventory,
          isLowStock,
          deficit: isLowStock ? inventory.reorderThreshold - inventory.availableQuantity : 0,
        },
      };
    },
  },

  // 4. getShipmentStatus
  getShipmentStatus: {
    description: 'Retrieve logistics and tracking status for an order shipment',
    schema: z.object({
      orderId: z.string(),
    }),
    execute: async (input: { orderId: string }, ctx: ToolContext): Promise<ToolResult> => {
      const shipment = await prisma.shipment.findUnique({
        where: { orderId: input.orderId },
      });

      if (!shipment) {
        return { success: false, error: `No shipment record found for order ${input.orderId}.` };
      }

      return { success: true, data: shipment };
    },
  },

  // 5. calculateOrderPriority
  calculateOrderPriority: {
    description: 'Recalculate order priority based on delay duration, customer tier, and order value',
    schema: z.object({
      orderId: z.string(),
    }),
    execute: async (input: { orderId: string }, ctx: ToolContext): Promise<ToolResult> => {
      const order = await prisma.order.findUnique({ where: { id: input.orderId } });
      if (!order) return { success: false, error: 'Order not found' };

      let calculatedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (order.delayDays > 7 || order.totalAmount > 5000) {
        calculatedPriority = 'CRITICAL';
      } else if (order.delayDays > 3 || order.totalAmount > 1500) {
        calculatedPriority = 'HIGH';
      } else if (order.delayDays > 0 || order.totalAmount > 500) {
        calculatedPriority = 'MEDIUM';
      }

      const updated = await prisma.order.update({
        where: { id: input.orderId },
        data: { priority: calculatedPriority },
      });

      return {
        success: true,
        data: { orderId: updated.id, oldPriority: order.priority, newPriority: updated.priority },
        verificationEvidence: { field: 'priority', expected: calculatedPriority, actual: updated.priority },
      };
    },
  },

  // 6. createRestockRequest
  createRestockRequest: {
    description: 'Create an authorized restock request for a depleted product SKU',
    schema: z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      reason: z.string(),
    }),
    execute: async (
      input: { productId: string; quantity: number; reason: string },
      ctx: ToolContext
    ): Promise<ToolResult> => {
      // Idempotency check: prevent duplicate restock request if step is retried
      const existing = await prisma.restockRequest.findFirst({
        where: {
          productId: input.productId,
          quantity: input.quantity,
          createdAt: { gt: new Date(Date.now() - 1000 * 60 * 10) }, // created in last 10 mins
        },
      });

      if (existing) {
        return {
          success: true,
          data: {
            restockRequest: existing,
            idempotentReplay: true,
          },
          verificationEvidence: {
            id: existing.id,
            productId: existing.productId,
            quantity: existing.quantity,
            status: existing.status,
          },
        };
      }

      const product = await prisma.product.findUnique({ where: { id: input.productId } });
      if (!product) return { success: false, error: `Product ID ${input.productId} not found.` };

      const restock = await prisma.restockRequest.create({
        data: {
          productId: input.productId,
          quantity: input.quantity,
          reason: input.reason,
          status: 'REQUESTED',
          requestedBy: ctx.userId || 'FlowPilot Agent',
        },
      });

      return {
        success: true,
        data: { restockRequest: restock },
        verificationEvidence: {
          id: restock.id,
          productId: restock.productId,
          quantity: restock.quantity,
          status: restock.status,
        },
      };
    },
  },

  // 7. createShipmentInvestigation
  createShipmentInvestigation: {
    description: 'Dispatch a shipment investigation ticket to warehouse operations',
    schema: z.object({
      orderId: z.string(),
      issueType: z.string(),
      priority: z.string().default('MEDIUM'),
      notes: z.string().optional(),
    }),
    execute: async (
      input: { orderId: string; issueType: string; priority?: string; notes?: string },
      ctx: ToolContext
    ): Promise<ToolResult> => {
      const order = await prisma.order.findUnique({ where: { id: input.orderId } });
      if (!order) return { success: false, error: `Order ${input.orderId} not found.` };

      const ticket = await prisma.shipmentInvestigation.create({
        data: {
          orderId: input.orderId,
          issueType: input.issueType,
          priority: input.priority || 'MEDIUM',
          notes: input.notes || 'Automated investigation initiated by FlowPilot AI',
          status: 'IN_PROGRESS',
        },
      });

      return {
        success: true,
        data: ticket,
        verificationEvidence: { ticketId: ticket.id, status: ticket.status },
      };
    },
  },

  // 8. expediteShipment
  expediteShipment: {
    description: 'Reroute a delayed order to an expedited priority carrier sandbox',
    schema: z.object({
      orderId: z.string(),
      carrier: z.string(),
      reason: z.string(),
    }),
    execute: async (
      input: { orderId: string; carrier: string; reason: string },
      ctx: ToolContext
    ): Promise<ToolResult> => {
      const shipment = await prisma.shipment.findUnique({ where: { orderId: input.orderId } });
      if (!shipment) return { success: false, error: 'Shipment record not found' };

      const expeditedDelivery = new Date();
      expeditedDelivery.setDate(expeditedDelivery.getDate() + 1); // Tomorrow

      const updated = await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          carrier: `${input.carrier} (Expedited)`,
          status: 'IN_TRANSIT',
          estimatedDelivery: expeditedDelivery,
          notes: `Expedited via FlowPilot. Reason: ${input.reason}`,
        },
      });

      return {
        success: true,
        data: updated,
        verificationEvidence: {
          carrier: updated.carrier,
          status: updated.status,
          estimatedDelivery: updated.estimatedDelivery,
        },
      };
    },
  },

  // 9. requestApproval
  requestApproval: {
    description: 'Submit an action requiring human authorization to the Approval Center',
    schema: z.object({
      actionType: z.string(),
      targetEntityType: z.string(),
      targetEntityId: z.string(),
      actionParams: z.record(z.any()),
      reason: z.string(),
      expectedImpact: z.string(),
      riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      approverRole: z.enum(['MANAGER', 'ADMIN']).default('MANAGER'),
    }),
    execute: async (input: any, ctx: ToolContext): Promise<ToolResult> => {
      const approval = await prisma.approvalRequest.create({
        data: {
          workflowId: ctx.workflowId,
          stepId: ctx.stepId,
          actionType: input.actionType,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId,
          actionParams: JSON.stringify(input.actionParams),
          reason: input.reason,
          expectedImpact: input.expectedImpact,
          riskLevel: input.riskLevel,
          approverRole: input.approverRole,
          requesterId: ctx.userId,
          status: 'PENDING',
        },
      });

      // Also create a notification for managers/admins
      await prisma.notification.create({
        data: {
          title: `Approval Required: ${input.actionType}`,
          message: `Workflow requested authorization for ${input.actionType} on ${input.targetEntityType} (${input.riskLevel} risk).`,
          type: 'ACTION_REQUIRED',
          linkUrl: `/approvals?id=${approval.id}`,
        },
      });

      return {
        success: true,
        data: { approvalId: approval.id, status: approval.status },
        verificationEvidence: { approvalId: approval.id, status: 'PENDING' },
      };
    },
  },

  // 10. getApprovalStatus
  getApprovalStatus: {
    description: 'Check the decision state of an existing approval request',
    schema: z.object({
      approvalId: z.string(),
    }),
    execute: async (input: { approvalId: string }, ctx: ToolContext): Promise<ToolResult> => {
      const approval = await prisma.approvalRequest.findUnique({
        where: { id: input.approvalId },
      });
      if (!approval) return { success: false, error: 'Approval request not found.' };

      return {
        success: true,
        data: {
          id: approval.id,
          status: approval.status,
          decisionComment: approval.decisionComment,
          decisionAt: approval.decisionAt,
        },
      };
    },
  },

  // 11. verifyOrderStatus
  verifyOrderStatus: {
    description: 'Independently inspect database state of an order and related records',
    schema: z.object({
      orderId: z.string(),
    }),
    execute: async (input: { orderId: string }, ctx: ToolContext): Promise<ToolResult> => {
      const order = await prisma.order.findUnique({
        where: { id: input.orderId },
        include: { shipment: true, product: { include: { inventoryItem: true } } },
      });

      if (!order) return { success: false, error: 'Order not found.' };

      return {
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          priority: order.priority,
          shipmentStatus: order.shipment?.status,
          inventoryAvailable: order.product.inventoryItem?.availableQuantity,
        },
      };
    },
  },

  // 12. addWorkflowComment
  addWorkflowComment: {
    description: 'Add an operator or system note to an ongoing workflow execution record',
    schema: z.object({
      workflowId: z.string(),
      comment: z.string(),
    }),
    execute: async (input: { workflowId: string; comment: string }, ctx: ToolContext): Promise<ToolResult> => {
      await AuditService.log({
        eventType: 'WORKFLOW_NOTE_ADDED',
        actorId: ctx.userId,
        workflowId: input.workflowId,
        details: { comment: input.comment },
      });

      return {
        success: true,
        data: { recorded: true, comment: input.comment },
      };
    },
  },

  // 13. simulateTransientFailureAndRecover (Key differentiator showcase!)
  simulateTransientFailureAndRecover: {
    description: 'Demonstration tool: Simulates a transient carrier gateway timeout on first attempt, then succeeds on automatic retry',
    schema: z.object({
      orderId: z.string(),
      targetAction: z.string(),
    }),
    execute: async (input: { orderId: string; targetAction: string }, ctx: ToolContext): Promise<ToolResult> => {
      const key = `${ctx.workflowId}:${input.orderId}:${input.targetAction}`;
      const attempts = (simulatedFailureMap.get(key) || 0) + 1;
      simulatedFailureMap.set(key, attempts);

      if (attempts === 1) {
        // First attempt intentionally fails with transient network error
        return {
          success: false,
          isTransient: true,
          error: 'TransientCarrierTimeout: Gateway 504 timed out while synchronizing dispatch manifest (attempt 1/3)',
        };
      }

      // Subsequent attempt succeeds!
      return {
        success: true,
        data: {
          recovered: true,
          attemptsRequired: attempts,
          syncedAt: new Date().toISOString(),
          status: 'CARRIER_MANIFEST_SYNCED',
        },
        verificationEvidence: {
          status: 'SYNCED',
          attempts: attempts,
          verifiedVia: 'Sandbox Carrier Gateway Response',
        },
      };
    },
  },
};

