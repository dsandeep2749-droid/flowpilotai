import { prisma } from '../database/db.js';
import { ToolRegistry, ToolContext, ToolResult } from '../tools/toolRegistry.js';
import { VerificationService } from './verificationService.js';
import { RecoveryService } from './recoveryService.js';
import { AuditService } from '../services/auditService.js';
import { ProposedAction } from '../services/geminiService.js';

export interface ExecuteStepResult {
  stepId: string;
  status: 'COMPLETED' | 'AWAITING_APPROVAL' | 'FAILED' | 'RECOVERED';
  outputData: any;
  verificationEvidence?: any;
  errorMessage?: string;
  approvalId?: string;
}

export class ExecutionService {
  static async executeAction(
    workflowId: string,
    stepId: string,
    action: ProposedAction,
    executionMode: string,
    user?: { id: string; role: string }
  ): Promise<ExecuteStepResult> {
    const startTime = Date.now();

    // 1. Approval Gate Check
    const needsApproval =
      action.requires_approval &&
      (executionMode === 'ASSISTED' ||
        (executionMode === 'AUTHORIZED_AUTOMATION' && ['HIGH', 'CRITICAL'].includes(action.risk_level)));

    if (needsApproval) {
      // Create Approval Request
      const approvalResult = await ToolRegistry.requestApproval.execute(
        {
          actionType: action.action_type,
          targetEntityType: 'OrderOrProduct',
          targetEntityId: action.target_id,
          actionParams: action.params,
          reason: action.reason,
          expectedImpact: `Mitigate delay for ${action.target_name || action.target_id}`,
          riskLevel: action.risk_level,
          approverRole: action.risk_level === 'CRITICAL' ? 'ADMIN' : 'MANAGER',
        },
        { workflowId, stepId, userId: user?.id, userRole: user?.role }
      );

      await prisma.workflowStep.update({
        where: { id: stepId },
        data: {
          status: 'PENDING',
          stepType: 'APPROVAL_GATE',
          errorMessage: 'Waiting for manager authorization in Approval Center.',
        },
      });

      await AuditService.log({
        eventType: 'APPROVAL_REQUESTED',
        actorId: user?.id,
        workflowId,
        entityType: 'ApprovalRequest',
        entityId: approvalResult.data.approvalId,
        details: { actionType: action.action_type, riskLevel: action.risk_level },
      });

      return {
        stepId,
        status: 'AWAITING_APPROVAL',
        outputData: { approvalId: approvalResult.data.approvalId, status: 'PENDING' },
        approvalId: approvalResult.data.approvalId,
      };
    }

    // 2. Identify corresponding backend tool
    let toolName: keyof typeof ToolRegistry;
    switch (action.action_type) {
      case 'create_restock_request':
        toolName = 'createRestockRequest';
        break;
      case 'create_shipment_investigation':
        toolName = 'createShipmentInvestigation';
        break;
      case 'expedite_shipment':
        toolName = 'expediteShipment';
        break;
      case 'update_order_priority':
        toolName = 'calculateOrderPriority';
        break;
      case 'simulate_transient_failure_and_recover':
        toolName = 'simulateTransientFailureAndRecover';
        break;
      default:
        throw new Error(`Unsupported tool action: ${action.action_type}`);
    }

    const tool = ToolRegistry[toolName];
    if (!tool) {
      throw new Error(`Tool implementation for ${toolName} not found in allowlist.`);
    }

    // 3. Execute with Transient Failure Recovery & Idempotency
    const idempotencyKey = `exec:${workflowId}:${stepId}:${toolName}`;
    const ctx: ToolContext = {
      userId: user?.id,
      userRole: user?.role,
      workflowId,
      stepId,
      idempotencyKey,
    };

    let step = await prisma.workflowStep.findUnique({ where: { id: stepId } });
    let retryCount = step?.retryCount || 0;
    const maxRetries = step?.maxRetries || 3;
    let toolResult: ToolResult | null = null;
    let recovered = false;

    while (retryCount <= maxRetries) {
      toolResult = await (tool.execute as any)(action.params, ctx);

      if (toolResult && toolResult.success) {
        break;
      }

      // If failed, evaluate recovery
      const errorMsg = toolResult?.error || 'Unknown tool failure';
      const decision = RecoveryService.evaluate(errorMsg, retryCount, maxRetries);

      await AuditService.log({
        eventType: 'FAILURE_RECORDED',
        actorId: user?.id,
        workflowId,
        outcome: 'FAILURE',
        details: { toolName, error: errorMsg, attempt: retryCount + 1, willRetry: decision.shouldRetry },
      });

      if (!decision.shouldRetry) {
        break;
      }

      // Increment retry count & sleep backoff
      retryCount++;
      await prisma.workflowStep.update({
        where: { id: stepId },
        data: {
          retryCount,
          errorMessage: `${errorMsg} (Recovering attempt ${retryCount}/${maxRetries}...)`,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, decision.delayMs));
      recovered = true;
    }

    const duration = Date.now() - startTime;

    // Record tool execution record
    await prisma.toolExecution.create({
      data: {
        workflowId,
        stepId,
        toolName,
        inputData: JSON.stringify(action.params),
        outputData: toolResult ? JSON.stringify(toolResult.data || toolResult.error) : null,
        status: toolResult?.success ? 'SUCCESS' : 'FAILURE',
        idempotencyKey,
        executedBy: user?.id || 'FlowPilot Agent',
        executionDurationMs: duration,
      },
    });

    if (!toolResult || !toolResult.success) {
      const finalError = toolResult?.error || 'Execution failed after retries';
      await prisma.workflowStep.update({
        where: { id: stepId },
        data: {
          status: 'FAILED',
          errorMessage: finalError,
          completedAt: new Date(),
        },
      });

      return {
        stepId,
        status: 'FAILED',
        outputData: null,
        errorMessage: finalError,
      };
    }

    // 4. Verification Service: Independently inspect DB state
    const verification = await VerificationService.verify(
      action.action_type,
      action.target_id,
      action.params
    );

    await prisma.workflowStep.update({
      where: { id: stepId },
      data: {
        status: 'COMPLETED',
        outputData: JSON.stringify(toolResult.data),
        verificationStatus: verification.status,
        verificationEvidence: JSON.stringify(verification.evidence),
        errorMessage: recovered ? `Recovered from transient failure after ${retryCount} retry.` : null,
        completedAt: new Date(),
      },
    });

    await AuditService.log({
      eventType: recovered ? 'RECOVERY_COMPLETED' : 'TOOL_EXECUTED',
      actorId: user?.id,
      workflowId,
      outcome: verification.verified ? 'SUCCESS' : 'FAILURE',
      details: {
        toolName,
        actionType: action.action_type,
        verified: verification.verified,
        evidence: verification.evidence,
        recovered,
        retries: retryCount,
      },
    });

    return {
      stepId,
      status: recovered ? 'RECOVERED' : 'COMPLETED',
      outputData: toolResult.data,
      verificationEvidence: verification.evidence,
    };
  }
}

