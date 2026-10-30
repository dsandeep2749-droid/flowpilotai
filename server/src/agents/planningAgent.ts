import { geminiService, PlanOutput } from '../services/geminiService.js';
import { InvestigationResult } from './investigationAgent.js';

export class PlanningAgent {
  static async plan(
    objective: string,
    investigation: InvestigationResult
  ): Promise<{ plan: PlanOutput; isDemoMode: boolean }> {
    return await geminiService.generateResolutionPlan(objective, {
      delayedOrders: investigation.delayedOrders,
      lowStockItems: investigation.lowStockItems,
      shipmentIssues: investigation.shipmentIssues,
    });
  }
}

