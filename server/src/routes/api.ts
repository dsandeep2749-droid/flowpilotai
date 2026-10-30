import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { DashboardController } from '../controllers/dashboardController.js';
import { OrderController } from '../controllers/orderController.js';
import { InventoryController } from '../controllers/inventoryController.js';
import { WorkflowController } from '../controllers/workflowController.js';
import { ApprovalController } from '../controllers/approvalController.js';
import { AuditController } from '../controllers/auditController.js';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { SettingsController } from '../controllers/settingsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'FlowPilot AI Backend',
  });
});

// Authentication
apiRouter.post('/auth/register', AuthController.register);
apiRouter.post('/auth/login', AuthController.login);
apiRouter.post('/auth/logout', AuthController.logout);
apiRouter.get('/auth/me', authenticate, AuthController.me);

// Dashboard
apiRouter.get('/dashboard/summary', authenticate, DashboardController.getSummary);

// Orders
apiRouter.get('/orders', authenticate, OrderController.list);
apiRouter.get('/orders/:id', authenticate, OrderController.getById);

// Inventory
apiRouter.get('/inventory', authenticate, InventoryController.list);
apiRouter.get('/inventory/:id', authenticate, InventoryController.getById);

// Workflows
apiRouter.post('/workflows', authenticate, WorkflowController.create);
apiRouter.get('/workflows', authenticate, WorkflowController.list);
apiRouter.get('/workflows/:id', authenticate, WorkflowController.getById);
apiRouter.post('/workflows/:id/cancel', authenticate, WorkflowController.cancel);
apiRouter.post('/workflows/:id/retry', authenticate, WorkflowController.retry);

// Approvals
apiRouter.get('/approvals', authenticate, ApprovalController.list);
apiRouter.get('/approvals/:id', authenticate, ApprovalController.getById);
apiRouter.post('/approvals/:id/approve', authenticate, requireRole(['MANAGER', 'ADMIN']), ApprovalController.approve);
apiRouter.post('/approvals/:id/reject', authenticate, requireRole(['MANAGER', 'ADMIN']), ApprovalController.reject);

// Audit History
apiRouter.get('/audit-events', authenticate, AuditController.list);

// Analytics
apiRouter.get('/analytics/summary', authenticate, AnalyticsController.getSummary);

// Settings & Demo Data
apiRouter.get('/settings', authenticate, SettingsController.getSettings);
apiRouter.post('/settings/reset-demo', authenticate, requireRole(['ADMIN']), SettingsController.resetDemoData);

