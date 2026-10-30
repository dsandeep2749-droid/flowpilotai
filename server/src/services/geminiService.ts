import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { config } from '../config/index.js';

export const ProposedActionSchema = z.object({
  action_type: z.enum([
    'create_restock_request',
    'create_shipment_investigation',
    'expedite_shipment',
    'update_order_priority',
    'request_customer_contact',
    'simulate_transient_failure_and_recover',
  ]),
  target_id: z.string(),
  target_name: z.string().optional(),
  reason: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  requires_approval: z.boolean(),
  params: z.record(z.any()).default({}),
});

export const PlanOutputSchema = z.object({
  objective: z.string(),
  summary: z.string(),
  root_causes: z.array(z.string()),
  investigation_findings: z.array(z.string()),
  proposed_actions: z.array(ProposedActionSchema),
  expected_outcomes: z.array(z.string()),
});

export type ProposedAction = z.infer<typeof ProposedActionSchema>;
export type PlanOutput = z.infer<typeof PlanOutputSchema>;

export class GeminiService {
  private client: GoogleGenAI | null = null;

  constructor() {
    if (config.geminiApiKey && config.geminiApiKey.trim() !== '') {
      try {
        this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
      } catch (err) {
        console.warn('[GeminiService] Failed to initialize GoogleGenAI client, falling back to Demo Mode:', err);
      }
    }
  }

  isLiveAiAvailable(): boolean {
    return this.client !== null && !config.enableDemoMode;
  }

  async generateResolutionPlan(
    objective: string,
    investigationData: {
      delayedOrders: any[];
      lowStockItems: any[];
      shipmentIssues: any[];
    }
  ): Promise<{ plan: PlanOutput; isDemoMode: boolean }> {
    // If live AI is available and not in demo mode, try Gemini API
    if (this.client && config.geminiApiKey) {
      try {
        const prompt = `You are FlowPilot AI, an autonomous business operations agent.
Task: Analyze operational data and propose an actionable, structured resolution plan.

USER OBJECTIVE: "${objective}"

INVESTIGATION EVIDENCE:
- Delayed Orders: ${JSON.stringify(investigationData.delayedOrders, null, 2)}
- Low Stock Items: ${JSON.stringify(investigationData.lowStockItems, null, 2)}
- Shipment Issues: ${JSON.stringify(investigationData.shipmentIssues, null, 2)}

PERMITTED ACTION TYPES:
1. "create_restock_request": params: { productId, quantity, reason } (risk_level: MEDIUM, requires_approval: true if quantity > 20)
2. "create_shipment_investigation": params: { orderId, issueType, priority } (risk_level: LOW, requires_approval: false)
3. "expedite_shipment": params: { orderId, carrier, reason } (risk_level: HIGH, requires_approval: true)
4. "update_order_priority": params: { orderId, priority } (risk_level: LOW, requires_approval: false)
5. "simulate_transient_failure_and_recover": params: { orderId, targetAction } (risk_level: LOW, requires_approval: false)

Return ONLY a valid JSON object matching this schema:
{
  "objective": string,
  "summary": string,
  "root_causes": string[],
  "investigation_findings": string[],
  "proposed_actions": [
    {
      "action_type": string,
      "target_id": string,
      "target_name": string,
      "reason": string,
      "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "requires_approval": boolean,
      "params": object
    }
  ],
  "expected_outcomes": string[]
}`;

        const response = await this.client.models.generateContent({
          model: config.aiModel || 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          const validated = PlanOutputSchema.parse(parsed);
          return { plan: validated, isDemoMode: false };
        }
      } catch (err) {
        console.error('[GeminiService Live AI Error] Fallback to deterministic demo engine:', err);
      }
    }

    // Deterministic Rule-Based Demo Mode Planner
    const plan = this.generateDeterministicPlan(objective, investigationData);
    return { plan, isDemoMode: true };
  }

  private generateDeterministicPlan(
    objective: string,
    investigationData: {
      delayedOrders: any[];
      lowStockItems: any[];
      shipmentIssues: any[];
    }
  ): PlanOutput {
    const findings: string[] = [];
    const rootCauses: string[] = [];
    const actions: ProposedAction[] = [];
    const expectedOutcomes: string[] = [];

    const delayedOrders = investigationData.delayedOrders || [];
    const lowStock = investigationData.lowStockItems || [];

    findings.push(`Found ${delayedOrders.length} delayed orders requiring operational resolution.`);

    // 1. Check for orders delayed due to inventory deficit
    const inventoryDelayed = delayedOrders.filter(
      (o) =>
        o.delayReason?.toLowerCase().includes('inventory') ||
        o.delayReason?.toLowerCase().includes('stock') ||
        (o.product && o.product.inventoryItem && o.product.inventoryItem.availableQuantity < o.quantity)
    );

    if (inventoryDelayed.length > 0) {
      rootCauses.push('Critical warehouse inventory shortage impacting order fulfillment');
      findings.push(`${inventoryDelayed.length} order(s) blocked by insufficient available inventory.`);

      for (const order of inventoryDelayed) {
        const prod = order.product;
        const reorderQty = prod?.inventoryItem?.reorderQuantity || Math.max(50, order.quantity * 2);
        actions.push({
          action_type: 'create_restock_request',
          target_id: prod?.id || order.productId,
          target_name: `${prod?.name || 'Product'} (SKU: ${prod?.sku || 'UNKNOWN'})`,
          reason: `Available stock (${prod?.inventoryItem?.availableQuantity ?? 0}) cannot fulfill order ${order.orderNumber} (needs ${order.quantity}).`,
          priority: 'HIGH',
          risk_level: 'MEDIUM',
          requires_approval: true,
          params: {
            productId: prod?.id || order.productId,
            quantity: reorderQty,
            reason: `Restock to fulfill delayed order ${order.orderNumber}`,
          },
        });
      }
      expectedOutcomes.push(`Generate verified restock requests for depleted SKUs with manager approval.`);
    }

    // 2. Check for carrier / shipment dispatch delays
    const shipmentDelayed = delayedOrders.filter(
      (o) =>
        o.delayReason?.toLowerCase().includes('carrier') ||
        o.delayReason?.toLowerCase().includes('shipment') ||
        o.delayReason?.toLowerCase().includes('transit') ||
        !o.shipment ||
        o.shipment.status === 'PENDING' ||
        o.shipment.status === 'EXCEPTION'
    );

    if (shipmentDelayed.length > 0) {
      rootCauses.push('Carrier logistics exception and pending dispatch delays');
      findings.push(`${shipmentDelayed.length} order(s) experiencing carrier or dispatch stalls.`);

      for (const order of shipmentDelayed) {
        if (order.priority === 'CRITICAL' || order.delayDays > 5) {
          actions.push({
            action_type: 'expedite_shipment',
            target_id: order.id,
            target_name: `Order ${order.orderNumber} (${order.customerName})`,
            reason: `Critical delay (${order.delayDays} days late). Request priority courier reroute.`,
            priority: 'CRITICAL',
            risk_level: 'HIGH',
            requires_approval: true,
            params: {
              orderId: order.id,
              carrier: 'Priority Express Logistics (Sandbox)',
              reason: 'Customer SLA breach threshold reached',
            },
          });
        } else {
          actions.push({
            action_type: 'create_shipment_investigation',
            target_id: order.id,
            target_name: `Shipment for ${order.orderNumber}`,
            reason: `Shipment status is ${order.shipment?.status || 'NOT_DISPATCHED'}. Initiate dispatch trace.`,
            priority: 'MEDIUM',
            risk_level: 'LOW',
            requires_approval: false,
            params: {
              orderId: order.id,
              issueType: 'DISPATCH_INSPECTION',
              priority: 'MEDIUM',
            },
          });
        }
      }
      expectedOutcomes.push('Dispatch logistics investigation tickets and route critical orders to expedited carrier.');
    }

    // 3. Include a demonstrated recoverable failure action to showcase FlowPilot's resilient self-healing
    const sampleOrder = delayedOrders[0];
    if (sampleOrder) {
      actions.push({
        action_type: 'simulate_transient_failure_and_recover',
        target_id: sampleOrder.id,
        target_name: `Logistics Gateway Sync for ${sampleOrder.orderNumber}`,
        reason: 'Verify carrier webhook synchronization under simulated network latency condition.',
        priority: 'MEDIUM',
        risk_level: 'LOW',
        requires_approval: false,
        params: {
          orderId: sampleOrder.id,
          targetAction: 'CARRIER_WEBHOOK_SYNC',
        },
      });
      expectedOutcomes.push('Exercise automatic retry with idempotency tracking and verified recovery.');
    }

    if (rootCauses.length === 0) {
      rootCauses.push('Standard lead time variance and supplier backlog');
    }

    return {
      objective,
      summary: `Analyzed ${delayedOrders.length} delayed orders across inventory, carrier dispatch, and supplier backlogs. Formulated ${actions.length} prioritized corrective actions.`,
      root_causes: rootCauses,
      investigation_findings: findings,
      proposed_actions: actions,
      expected_outcomes: expectedOutcomes,
    };
  }
}

export const geminiService = new GeminiService();
