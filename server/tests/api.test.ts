import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/database/db.js';
import { VerificationService } from '../src/agents/verificationService.js';
import { RecoveryService } from '../src/agents/recoveryService.js';
import { ToolRegistry } from '../src/tools/toolRegistry.js';

describe('FlowPilot AI API & Services Integration Tests', () => {
  let adminToken: string;
  let operatorToken: string;

  beforeAll(async () => {
    // Authenticate as Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@flowpilot.ai', password: 'AdminPassword123!' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // Authenticate as Operator
    const operatorRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operator@flowpilot.ai', password: 'OperatorPassword123!' });
    expect(operatorRes.status).toBe(200);
    operatorToken = operatorRes.body.token;
  });

  describe('1. Authentication & Role Permissions', () => {
    it('rejects invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@flowpilot.ai', password: 'WrongPassword' });
      expect(res.status).toBe(401);
    });

    it('denies access to protected endpoint without token', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).toBe(401);
    });

    it('allows authenticated operator to fetch orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBeGreaterThan(0);
    });

    it('denies operator from resetting demo data (admin only)', async () => {
      const res = await request(app)
        .post('/api/settings/reset-demo')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('2. Tool Execution System & Verification', () => {
    it('executes getDelayedOrders tool successfully', async () => {
      const result = await ToolRegistry.getDelayedOrders.execute(
        { limit: 10 },
        { workflowId: 'test-wf' }
      );
      expect(result.success).toBe(true);
      expect(result.data.orders.length).toBeGreaterThan(0);
    });

    it('creates restock request and verifies it independently in database', async () => {
      const product = await prisma.product.findFirst();
      expect(product).toBeDefined();

      const toolResult = await ToolRegistry.createRestockRequest.execute(
        {
          productId: product!.id,
          quantity: 75,
          reason: 'Test restock for integration test',
        },
        { workflowId: 'test-wf', userId: 'tester' }
      );
      expect(toolResult.success).toBe(true);

      // Independent verification service check
      const verification = await VerificationService.verify(
        'create_restock_request',
        product!.id,
        { productId: product!.id, quantity: 75 }
      );
      expect(verification.verified).toBe(true);
      expect(verification.status).toBe('VERIFIED');
      expect(verification.evidence.quantity).toBe(75);
    });
  });

  describe('3. Failure Recovery & Idempotency', () => {
    it('classifies transient timeout and evaluates retry correctly', () => {
      const transientErr = 'TransientCarrierTimeout: Gateway 504 timed out';
      const decision = RecoveryService.evaluate(transientErr, 0, 3);
      expect(decision.shouldRetry).toBe(true);
      expect(decision.delayMs).toBeGreaterThan(0);

      // Exceeded max retries should stop
      const exceededDecision = RecoveryService.evaluate(transientErr, 3, 3);
      expect(exceededDecision.shouldRetry).toBe(false);
    });

    it('demonstrates self-healing transient tool recovery', async () => {
      const order = await prisma.order.findFirst();
      expect(order).toBeDefined();

      const uniqueWfId = `wf-recovery-${Date.now()}`;

      // First attempt fails with transient error
      const attempt1 = await ToolRegistry.simulateTransientFailureAndRecover.execute(
        { orderId: order!.id, targetAction: 'CARRIER_WEBHOOK_SYNC' },
        { workflowId: uniqueWfId }
      );
      expect(attempt1.success).toBe(false);
      expect(attempt1.isTransient).toBe(true);

      // Second attempt succeeds
      const attempt2 = await ToolRegistry.simulateTransientFailureAndRecover.execute(
        { orderId: order!.id, targetAction: 'CARRIER_WEBHOOK_SYNC' },
        { workflowId: uniqueWfId }
      );
      expect(attempt2.success).toBe(true);
      expect(attempt2.data.recovered).toBe(true);
      expect(attempt2.data.attemptsRequired).toBe(2);
    });
  });

  describe('4. Human Approval Gating', () => {
    let pendingApprovalId: string;

    beforeAll(async () => {
      // Find or create a pending approval request for idempotent testing
      let pending = await prisma.approvalRequest.findFirst({
        where: { status: 'PENDING' },
      });

      if (!pending) {
        const wf = await prisma.workflow.create({
          data: {
            title: 'Test Approval Workflow',
            objective: 'Test approval gating',
            status: 'AWAITING_APPROVAL',
          },
        });
        pending = await prisma.approvalRequest.create({
          data: {
            workflowId: wf.id,
            actionType: 'expedite_shipment',
            targetEntityType: 'Order',
            targetEntityId: 'order-test-1',
            actionParams: JSON.stringify({ carrier: 'Express Air' }),
            reason: 'Test high risk SLA breach',
            expectedImpact: 'Faster delivery',
            riskLevel: 'HIGH',
            status: 'PENDING',
          },
        });
      }

      pendingApprovalId = pending.id;
    });

    it('prevents operator from approving high-risk request', async () => {
      const res = await request(app)
        .post(`/api/approvals/${pendingApprovalId}/approve`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ comment: 'Unauthorized operator approval attempt' });
      expect(res.status).toBe(403);
    });

    it('allows admin or manager to approve request', async () => {
      const res = await request(app)
        .post(`/api/approvals/${pendingApprovalId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ comment: 'Approved by Administrator for emergency expedited transit.' });
      expect(res.status).toBe(200);
      expect(res.body.approval.status).toBe('APPROVED');
    });
  });
});

