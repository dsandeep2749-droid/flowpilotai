export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'DELAYED' | 'RESOLVED' | 'CANCELLED';
export type ShipmentStatus = 'PENDING' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELAYED' | 'EXCEPTION' | 'DELIVERED';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
  inventoryItem?: InventoryItem;
  restockRequests?: any[];
}

export interface InventoryItem {
  id: string;
  productId: string;
  product: Product;
  availableQuantity: number;
  reservedQuantity: number;
  reorderThreshold: number;
  reorderQuantity: number;
  supplierName: string;
  supplierContact?: string;
  lastRestockedAt?: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber?: string;
  carrier: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  estimatedDelivery?: string;
  dispatchedAt?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  product: Product;
  quantity: number;
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate: string;
  priority: Priority;
  status: OrderStatus;
  delayReason?: string;
  delayDays: number;
  shipment?: Shipment;
  createdAt: string;
}

export type WorkflowStatus =
  | 'DRAFT'
  | 'QUEUED'
  | 'INVESTIGATING'
  | 'PLANNING'
  | 'VALIDATING'
  | 'AWAITING_APPROVAL'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'RECOVERING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type WorkflowExecutionMode = 'PLAN_ONLY' | 'ASSISTED' | 'AUTHORIZED_AUTOMATION';

export type StepType =
  | 'INVESTIGATION'
  | 'PLANNING'
  | 'VALIDATION'
  | 'APPROVAL_GATE'
  | 'TOOL_EXECUTION'
  | 'VERIFICATION'
  | 'RECOVERY';

export type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'FAILED';

export interface WorkflowStep {
  id: string;
  workflowId: string;
  sequence: number;
  stepType: StepType;
  description: string;
  status: StepStatus;
  toolName?: string;
  inputParams?: any;
  outputData?: any;
  retryCount: number;
  maxRetries: number;
  verificationStatus: VerificationStatus;
  verificationEvidence?: any;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Workflow {
  id: string;
  title: string;
  objective: string;
  workflowType: string;
  executionMode: WorkflowExecutionMode;
  status: WorkflowStatus;
  creatorId?: string;
  creator?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  planSummary?: string;
  proposedPlan?: any;
  finalSummary?: string;
  failureReason?: string;
  isDemoMode: boolean;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  steps?: WorkflowStep[];
  approvals?: ApprovalRequest[];
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  workflow?: {
    id: string;
    title: string;
    status: string;
  };
  stepId?: string;
  actionType: string;
  targetEntityType: string;
  targetEntityId: string;
  actionParams: any;
  reason: string;
  expectedImpact: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: ApprovalStatus;
  requesterId?: string;
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  approverId?: string;
  approver?: {
    id: string;
    name: string;
    email: string;
  };
  approverRole: string;
  decisionComment?: string;
  decisionAt?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  workflowId?: string;
  entityType?: string;
  entityId?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'DENIED';
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  activeWorkflows: number;
  completedWorkflows: number;
  awaitingApprovalWorkflows: number;
  failedWorkflows: number;
  delayedOrdersCount: number;
  avgCompletionTimeSeconds: number;
  totalOrders: number;
  lowStockItemsCount: number;
  workflowStatusDistribution: { name: string; value: number }[];
  activityTrends: { date: string; created: number; completed: number }[];
  recentExecutions: Workflow[];
  highPriorityDelayedOrders: Order[];
  pendingApprovals: ApprovalRequest[];
}
