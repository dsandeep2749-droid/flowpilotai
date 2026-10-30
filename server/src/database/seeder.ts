import bcrypt from 'bcryptjs';
import { prisma } from './db.js';

export async function seedDatabase() {
  console.log('[Seed] Starting database wipe & reseed...');

  // Clean existing records in referential order
  await prisma.toolExecution.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.restockRequest.deleteMany();
  await prisma.shipmentInvestigation.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', salt);
  const managerPasswordHash = await bcrypt.hash('ManagerPassword123!', salt);
  const operatorPasswordHash = await bcrypt.hash('OperatorPassword123!', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@flowpilot.ai',
      name: 'Sarah Connor (Admin)',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@flowpilot.ai',
      name: 'Marcus Vance (Operations Manager)',
      passwordHash: managerPasswordHash,
      role: 'MANAGER',
    },
  });

  const operator = await prisma.user.create({
    data: {
      email: 'operator@flowpilot.ai',
      name: 'Alex Rivera (Fulfillment Lead)',
      passwordHash: operatorPasswordHash,
      role: 'OPERATOR',
    },
  });

  // 2. Seed 10 Products with Inventory
  const productsData = [
    { sku: 'IND-SEN-001', name: 'Precision LiDAR Sensor Mod-4', price: 1250.0, available: 4, reserved: 8, threshold: 15, reorderQty: 40, supplier: 'OptiWave Photonics' },
    { sku: 'IND-SER-002', name: 'Brushless High-Torque Servo 24V', price: 420.0, available: 2, reserved: 12, threshold: 20, reorderQty: 50, supplier: 'Apex Dynamic Drives' },
    { sku: 'IND-PLC-003', name: 'Industrial Edge Controller X7', price: 2890.0, available: 18, reserved: 5, threshold: 10, reorderQty: 25, supplier: 'Nexus Automation' },
    { sku: 'IND-MOT-004', name: 'Synchronous Stepper Motor 5A', price: 185.0, available: 85, reserved: 20, threshold: 30, reorderQty: 100, supplier: 'Apex Dynamic Drives' },
    { sku: 'IND-REL-005', name: 'Solid State Relay 3-Phase 80A', price: 95.0, available: 12, reserved: 35, threshold: 25, reorderQty: 80, supplier: 'ElectroSwitch Global' },
    { sku: 'IND-ENC-006', name: 'Optical Rotary Encoder 4096-PPR', price: 340.0, available: 1, reserved: 6, threshold: 10, reorderQty: 30, supplier: 'OptiWave Photonics' },
    { sku: 'IND-PWS-007', name: 'DIN-Rail Power Supply 48V 480W', price: 210.0, available: 42, reserved: 14, threshold: 15, reorderQty: 40, supplier: 'ElectroSwitch Global' },
    { sku: 'IND-VAL-008', name: 'Pneumatic Proportional Valve 1/4"', price: 580.0, available: 8, reserved: 10, threshold: 12, reorderQty: 30, supplier: 'Fluidics Global' },
    { sku: 'IND-HMI-009', name: 'Capacitive Rugged HMI Panel 10"', price: 1650.0, available: 14, reserved: 4, threshold: 8, reorderQty: 20, supplier: 'Nexus Automation' },
    { sku: 'IND-CAB-010', name: 'Heavy-Duty Shielded Bus Cable 100m', price: 320.0, available: 60, reserved: 15, threshold: 20, reorderQty: 50, supplier: 'ElectroSwitch Global' },
  ];

  const createdProducts: any[] = [];
  for (const item of productsData) {
    const p = await prisma.product.create({
      data: {
        sku: item.sku,
        name: item.name,
        unitPrice: item.price,
        inventoryItem: {
          create: {
            availableQuantity: item.available,
            reservedQuantity: item.reserved,
            reorderThreshold: item.threshold,
            reorderQuantity: item.reorderQty,
            supplierName: item.supplier,
            supplierContact: `procurement@${item.supplier.toLowerCase().replace(/\s+/g, '')}.com`,
            lastRestockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
          },
        },
      },
      include: { inventoryItem: true },
    });
    createdProducts.push(p);
  }

  // 3. Seed Orders
  const now = new Date();
  const pastDay = (days: number) => new Date(now.getTime() - 1000 * 60 * 60 * 24 * days);
  const futureDay = (days: number) => new Date(now.getTime() + 1000 * 60 * 60 * 24 * days);

  const ordersData = [
    {
      orderNumber: 'ORD-2026-9001',
      customerName: 'AeroDynamics Aerospace Ltd',
      customerEmail: 'ops@aerodynamics.io',
      productIndex: 0,
      quantity: 6,
      amount: 7500.0,
      orderDate: pastDay(8),
      expectedDate: pastDay(4),
      priority: 'CRITICAL',
      status: 'DELAYED',
      delayReason: 'Insufficient inventory: warehouse stock depleted below required threshold',
      delayDays: 4,
      shipment: { status: 'PENDING', carrier: 'FreightX Logistics', tracking: null, dest: 'Seattle, WA' },
    },
    {
      orderNumber: 'ORD-2026-9002',
      customerName: 'RoboTech Industrial Automation',
      customerEmail: 'logistics@robotech.de',
      productIndex: 1,
      quantity: 10,
      amount: 4200.0,
      orderDate: pastDay(10),
      expectedDate: pastDay(5),
      priority: 'HIGH',
      status: 'DELAYED',
      delayReason: 'Shipment exception: Carrier vehicle mechanical breakdown during hub transit',
      delayDays: 5,
      shipment: { status: 'EXCEPTION', carrier: 'Continental Freight', tracking: 'CF-9928194', dest: 'Munich, Germany' },
    },
    {
      orderNumber: 'ORD-2026-9003',
      customerName: 'Quantum Medical Systems',
      customerEmail: 'supply@quantummed.com',
      productIndex: 2,
      quantity: 3,
      amount: 8670.0,
      orderDate: pastDay(6),
      expectedDate: pastDay(2),
      priority: 'CRITICAL',
      status: 'DELAYED',
      delayReason: 'Shipment not dispatched: missing customs compliance declaration and dispatch hold',
      delayDays: 2,
      shipment: { status: 'PENDING', carrier: 'Global Air Cargo', tracking: null, dest: 'Zurich, Switzerland' },
    },
    {
      orderNumber: 'ORD-2026-9004',
      customerName: 'Precision Motion Corp',
      customerEmail: 'orders@precisionmotion.com',
      productIndex: 5,
      quantity: 5,
      amount: 1700.0,
      orderDate: pastDay(9),
      expectedDate: pastDay(3),
      priority: 'HIGH',
      status: 'DELAYED',
      delayReason: 'Insufficient inventory: supplier shipment overdue by 6 days',
      delayDays: 3,
      shipment: { status: 'PENDING', carrier: 'Internal Fleet', tracking: null, dest: 'Chicago, IL' },
    },
    {
      orderNumber: 'ORD-2026-9005',
      customerName: 'Apex Assembly Solutions',
      customerEmail: 'procure@apexassembly.net',
      productIndex: 4,
      quantity: 20,
      amount: 1900.0,
      orderDate: pastDay(5),
      expectedDate: pastDay(1),
      priority: 'MEDIUM',
      status: 'DELAYED',
      delayReason: 'Carrier congestion at intermediate distribution terminal',
      delayDays: 1,
      shipment: { status: 'DELAYED', carrier: 'SwiftLine Express', tracking: 'SL-4819201', dest: 'Dallas, TX' },
    },
    {
      orderNumber: 'ORD-2026-9006',
      customerName: 'HydraTech Systems LLC',
      customerEmail: 'j.miller@hydratech.com',
      productIndex: 7,
      quantity: 8,
      amount: 4640.0,
      orderDate: pastDay(7),
      expectedDate: pastDay(3),
      priority: 'HIGH',
      status: 'DELAYED',
      delayReason: 'Insufficient inventory: waiting for batch quality certification release',
      delayDays: 3,
      shipment: { status: 'PENDING', carrier: 'SwiftLine Express', tracking: null, dest: 'Atlanta, GA' },
    },
    {
      orderNumber: 'ORD-2026-9007',
      customerName: 'VoltGen Energy Storage',
      customerEmail: 'parts@voltgen.com',
      productIndex: 6,
      quantity: 4,
      amount: 840.0,
      orderDate: pastDay(2),
      expectedDate: futureDay(3),
      priority: 'MEDIUM',
      status: 'PROCESSING',
      delayReason: null,
      delayDays: 0,
      shipment: { status: 'IN_TRANSIT', carrier: 'FastTrack Ground', tracking: 'FT-1029481', dest: 'Phoenix, AZ' },
    },
    {
      orderNumber: 'ORD-2026-9008',
      customerName: 'BioSynthetix Laboratories',
      customerEmail: 'facility@biosynthetix.io',
      productIndex: 8,
      quantity: 2,
      amount: 3300.0,
      orderDate: pastDay(1),
      expectedDate: futureDay(4),
      priority: 'MEDIUM',
      status: 'PROCESSING',
      delayReason: null,
      delayDays: 0,
      shipment: { status: 'DISPATCHED', carrier: 'FastTrack Ground', tracking: 'FT-1029482', dest: 'Boston, MA' },
    },
    {
      orderNumber: 'ORD-2026-9009',
      customerName: 'Titan Heavy Machinery',
      customerEmail: 'assembly@titanmachinery.com',
      productIndex: 3,
      quantity: 15,
      amount: 2775.0,
      orderDate: pastDay(3),
      expectedDate: futureDay(2),
      priority: 'MEDIUM',
      status: 'PROCESSING',
      delayReason: null,
      delayDays: 0,
      shipment: { status: 'IN_TRANSIT', carrier: 'HeavyHaul Freight', tracking: 'HH-881920', dest: 'Cleveland, OH' },
    },
    {
      orderNumber: 'ORD-2026-9010',
      customerName: 'CyberGrid Systems',
      customerEmail: 'hardware@cybergrid.org',
      productIndex: 9,
      quantity: 8,
      amount: 2560.0,
      orderDate: pastDay(1),
      expectedDate: futureDay(5),
      priority: 'LOW',
      status: 'PENDING',
      delayReason: null,
      delayDays: 0,
      shipment: { status: 'PENDING', carrier: 'Internal Fleet', tracking: null, dest: 'Austin, TX' },
    },
    {
      orderNumber: 'ORD-2026-9011',
      customerName: 'Spectra Vision Robotics',
      customerEmail: 'eng@spectravision.com',
      productIndex: 0,
      quantity: 2,
      amount: 2500.0,
      orderDate: pastDay(12),
      expectedDate: pastDay(7),
      priority: 'CRITICAL',
      status: 'RESOLVED',
      delayReason: 'Resolved by expedited carrier reroute',
      delayDays: 0,
      shipment: { status: 'DELIVERED', carrier: 'Priority Express Logistics (Expedited)', tracking: 'PEL-990182', dest: 'San Jose, CA' },
    },
    {
      orderNumber: 'ORD-2026-9012',
      customerName: 'Nexus Foundry Automation',
      customerEmail: 'support@nexusfoundry.com',
      productIndex: 2,
      quantity: 1,
      amount: 2890.0,
      orderDate: pastDay(15),
      expectedDate: pastDay(10),
      priority: 'MEDIUM',
      status: 'RESOLVED',
      delayReason: 'Inventory restocked and delivered',
      delayDays: 0,
      shipment: { status: 'DELIVERED', carrier: 'Continental Freight', tracking: 'CF-881291', dest: 'Detroit, MI' },
    },
    {
      orderNumber: 'ORD-2026-9013',
      customerName: 'Alpine Sensor Systems',
      customerEmail: 'dispatch@alpinesensors.ch',
      productIndex: 5,
      quantity: 2,
      amount: 680.0,
      orderDate: pastDay(2),
      expectedDate: futureDay(6),
      priority: 'LOW',
      status: 'PENDING',
      delayReason: null,
      delayDays: 0,
      shipment: { status: 'PENDING', carrier: 'Internal Fleet', tracking: null, dest: 'Geneva, Switzerland' },
    },
    {
      orderNumber: 'ORD-2026-9014',
      customerName: 'Cascade Controls LLC',
      customerEmail: 'orders@cascadecontrols.com',
      productIndex: 6,
      quantity: 5,
      amount: 1050.0,
      orderDate: pastDay(14),
      expectedDate: pastDay(11),
      priority: 'LOW',
      status: 'RESOLVED',
      delayReason: 'Delivered',
      delayDays: 0,
      shipment: { status: 'DELIVERED', carrier: 'FastTrack Ground', tracking: 'FT-1029400', dest: 'Portland, OR' },
    },
    {
      orderNumber: 'ORD-2026-9015',
      customerName: 'Nova Microelectronics',
      customerEmail: 'procure@novamicro.com',
      productIndex: 1,
      quantity: 4,
      amount: 1680.0,
      orderDate: pastDay(3),
      expectedDate: futureDay(1),
      priority: 'HIGH',
      status: 'PROCESSING',
      delayReason: null,
      delayDays: 0,
      shipment: { status: 'DISPATCHED', carrier: 'FastTrack Ground', tracking: 'FT-1029499', dest: 'San Diego, CA' },
    },
    {
      orderNumber: 'ORD-2026-9016',
      customerName: 'OmniDrive Technologies',
      customerEmail: 'supply@omnidrive.io',
      productIndex: 3,
      quantity: 10,
      amount: 1850.0,
      orderDate: pastDay(1),
      expectedDate: futureDay(4),
      priority: 'MEDIUM',
      status: 'PENDING',
      delayReason: null,
      delayDays: 0,
      shipment: { status: 'PENDING', carrier: 'Internal Fleet', tracking: null, dest: 'Denver, CO' },
    },
  ];

  const createdOrders: any[] = [];
  for (const o of ordersData) {
    const product = createdProducts[o.productIndex];
    const createdOrder = await prisma.order.create({
      data: {
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        productId: product.id,
        quantity: o.quantity,
        totalAmount: o.amount,
        orderDate: o.orderDate,
        expectedDeliveryDate: o.expectedDate,
        priority: o.priority,
        status: o.status,
        delayReason: o.delayReason,
        delayDays: o.delayDays,
        shipment: {
          create: {
            carrier: o.shipment.carrier,
            status: o.shipment.status,
            trackingNumber: o.shipment.tracking,
            destination: o.shipment.dest,
            origin: 'Central Distribution Hub',
            estimatedDelivery: o.expectedDate,
            dispatchedAt: o.shipment.status !== 'PENDING' ? o.orderDate : null,
          },
        },
      },
      include: { shipment: true },
    });
    createdOrders.push(createdOrder);
  }

  // 4. Seed Completed Workflow
  const completedWf = await prisma.workflow.create({
    data: {
      title: 'Resolved Urgent Q3 Delayed Orders',
      objective: 'Investigate delayed orders, identify their causes, prioritize them, and resolve the issues wherever possible.',
      workflowType: 'ORDER_DELAY_RESOLUTION',
      executionMode: 'AUTHORIZED_AUTOMATION',
      status: 'COMPLETED',
      creatorId: operator.id,
      isDemoMode: true,
      planSummary: 'Investigated delayed orders across inventory, carrier dispatch, and supplier backlogs. Formulated and verified 3 corrective actions.',
      finalSummary: 'Successfully executed and independently verified all corrective actions. Delayed orders resolved with updated tracking.',
      startedAt: pastDay(2),
      completedAt: new Date(pastDay(2).getTime() + 1000 * 45),
    },
  });

  await prisma.workflowStep.createMany({
    data: [
      {
        workflowId: completedWf.id,
        sequence: 1,
        stepType: 'INVESTIGATION',
        description: 'Investigate delayed orders, inventory deficits, and logistics exceptions',
        status: 'COMPLETED',
        toolName: 'getDelayedOrders',
        outputData: JSON.stringify({ analyzedOrdersCount: 6, criticalCount: 2 }),
        verificationStatus: 'VERIFIED',
        verificationEvidence: JSON.stringify({ verifiedRecordsCount: 6 }),
        completedAt: pastDay(2),
      },
      {
        workflowId: completedWf.id,
        sequence: 2,
        stepType: 'PLANNING',
        description: 'Generate deterministic rule-based resolution plan (Demo Mode)',
        status: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        verificationEvidence: JSON.stringify({ actionsProposed: 3, model: 'Rule-Based Demo Engine' }),
        completedAt: pastDay(2),
      },
      {
        workflowId: completedWf.id,
        sequence: 3,
        stepType: 'TOOL_EXECUTION',
        description: 'CREATE RESTOCK REQUEST: Precision LiDAR Sensor Mod-4',
        status: 'COMPLETED',
        toolName: 'createRestockRequest',
        outputData: JSON.stringify({ restockRequestId: 'seed-restock-1', quantity: 40 }),
        verificationStatus: 'VERIFIED',
        verificationEvidence: JSON.stringify({ restockRequestId: 'seed-restock-1', status: 'REQUESTED' }),
        completedAt: pastDay(2),
      },
    ],
  });

  // 5. Seed Pending Approval Request & Associated Workflow
  const pendingWf = await prisma.workflow.create({
    data: {
      title: 'Delayed Order ORD-2026-9001 Resolution',
      objective: 'Investigate critical delay for AeroDynamics order and approve high-priority expedited logistics.',
      workflowType: 'ORDER_DELAY_RESOLUTION',
      executionMode: 'ASSISTED',
      status: 'AWAITING_APPROVAL',
      creatorId: operator.id,
      isDemoMode: true,
      planSummary: 'Critical order delay requires Manager authorization to reroute to Priority Express Air Freight.',
      startedAt: pastDay(1),
    },
  });

  const gateStep = await prisma.workflowStep.create({
    data: {
      workflowId: pendingWf.id,
      sequence: 1,
      stepType: 'APPROVAL_GATE',
      description: 'Human Approval Gate: Expedite Shipment for ORD-2026-9001',
      status: 'PENDING',
      toolName: 'expediteShipment',
      inputParams: JSON.stringify({
        orderId: createdOrders[0].id,
        carrier: 'Priority Express Logistics',
        reason: 'Critical SLA delay threshold reached for aerospace partner',
      }),
      errorMessage: 'Waiting for manager authorization in Approval Center.',
    },
  });

  const pendingApproval = await prisma.approvalRequest.create({
    data: {
      workflowId: pendingWf.id,
      stepId: gateStep.id,
      actionType: 'expedite_shipment',
      targetEntityType: 'Order',
      targetEntityId: createdOrders[0].id,
      actionParams: JSON.stringify({
        orderId: createdOrders[0].id,
        carrier: 'Priority Express Logistics',
        reason: 'Critical SLA delay threshold reached for aerospace partner',
      }),
      reason: 'Order is delayed by 4 days due to warehouse stock depletion; urgent aerospace customer contract at risk.',
      expectedImpact: 'Re-routes package to overnight air transit with delivery in 24 hours.',
      riskLevel: 'HIGH',
      status: 'PENDING',
      requesterId: operator.id,
      approverRole: 'MANAGER',
    },
  });

  await prisma.notification.create({
    data: {
      title: 'Action Required: High-Risk Expedited Shipment',
      message: 'Alex Rivera requested authorization to expedite Order ORD-2026-9001 via Priority Express Logistics.',
      type: 'ACTION_REQUIRED',
      linkUrl: `/approvals?id=${pendingApproval.id}`,
    },
  });

  // 6. Seed Audit Events
  await prisma.auditEvent.createMany({
    data: [
      {
        eventType: 'USER_LOGIN',
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.role,
        outcome: 'SUCCESS',
        details: JSON.stringify({ client: 'Chrome / Windows' }),
      },
      {
        eventType: 'WORKFLOW_CREATED',
        actorId: operator.id,
        actorEmail: operator.email,
        actorRole: operator.role,
        workflowId: completedWf.id,
        outcome: 'SUCCESS',
        details: JSON.stringify({ objective: completedWf.objective }),
      },
      {
        eventType: 'PLAN_GENERATED',
        actorId: operator.id,
        workflowId: completedWf.id,
        outcome: 'SUCCESS',
        details: JSON.stringify({ actionsCount: 3, isDemoMode: true }),
      },
      {
        eventType: 'TOOL_EXECUTED',
        actorId: operator.id,
        workflowId: completedWf.id,
        outcome: 'SUCCESS',
        details: JSON.stringify({ tool: 'createRestockRequest', verified: true }),
      },
      {
        eventType: 'WORKFLOW_COMPLETED',
        actorId: operator.id,
        workflowId: completedWf.id,
        outcome: 'SUCCESS',
      },
      {
        eventType: 'APPROVAL_REQUESTED',
        actorId: operator.id,
        actorEmail: operator.email,
        actorRole: operator.role,
        workflowId: pendingWf.id,
        entityType: 'ApprovalRequest',
        entityId: pendingApproval.id,
        outcome: 'PENDING',
        details: JSON.stringify({ actionType: 'expedite_shipment', riskLevel: 'HIGH' }),
      },
    ],
  });

  console.log('[Seed] Seeding completed successfully!');
}

