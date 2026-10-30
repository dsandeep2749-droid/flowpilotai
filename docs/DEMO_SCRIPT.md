# FlowPilot AI — Hackathon Demonstration Script (3–5 Minutes)

### Target Audience
Judges, enterprise operations leaders, and software engineers.

---

## 0:00 – 0:40: The Operational Coordination Problem
- **Speaker**: "In modern enterprise supply chains and e-commerce operations, resolving exceptions is painful. When customer orders are delayed, employees spend hours logging into multiple ERP systems, inspecting warehouse inventory levels, checking carrier tracking exceptions, manually seeking manager approval, and emailing suppliers.
- **Hook**: "FlowPilot AI eliminates this coordination overhead with an autonomous, governed agent that converts business problems into verified operational outcomes."

---

## 0:40 – 1:20: The Operations Control Center
- **Action**: Open the **Overview Dashboard** (`http://localhost:5173`).
- **Highlight**:
  - Point to real-time KPI metrics: Active Workflows, Delayed Orders, Pending Approvals, and Average Resolution Lead Time.
  - Show the Urgent Delayed Orders list: Orders delayed by 2–5 days due to depleted warehouse inventory, missing customs info, or carrier vehicle breakdowns.
  - Emphasize: *"Notice that every metric and trend displayed here is calculated live from our persistent database, not hardcoded mock data."*

---

## 1:20 – 2:10: Natural Language Task Center & Autonomous Planning
- **Action**: Navigate to **AI Task Center** (`/task-center`).
- **Input**: Select the preset:
  > *"Investigate all delayed orders, identify their causes, prioritize them, and resolve the issues wherever possible."*
- **Select Execution Mode**: Choose **Assisted Execution** (governed mode with approval gates).
- **Click**: **Launch Workflow Orchestration**.
- **Highlight**:
  - The application navigates to the **Workflow Monitor** (`/workflows/:id`).
  - Show real-time state machine transitions: `INVESTIGATING` → `PLANNING` → `VALIDATING` → `EXECUTING`.
  - Open the Investigation Step: Show how the agent queried `getDelayedOrders`, identified inventory deficits and carrier stalls, and formatted an evidence dossier.

---

## 2:10 – 3:10: Human Authorization Gate (Approval Center)
- **Action**: In the Workflow Monitor, observe the workflow automatically pause at status: **`AWAITING_APPROVAL`**.
- **Explanation**: *"Our policy specifies that actions with HIGH or CRITICAL risk (such as re-routing to an expensive expedited air carrier) require human manager sign-off. The AI cannot unilaterally spend company funds without authorization."*
- **Action**: Click **Review Pending Approval in Gate** (or navigate to `/approvals`).
- **Show Role Gating**:
  - Demonstrate that an **OPERATOR** cannot approve.
  - Use the role switcher in the top navigation to switch to **MANAGER** (`Marcus Vance`).
  - Click **Authorize Action**, input: *"Approved for emergency aerospace partner fulfillment"*, and submit.
- **Highlight**: The approval is granted, and the workflow automatically resumes execution!

---

## 3:10 – 4:00: Resilient Self-Healing & Independent Database Verification
- **Action**: Return to the **Workflow Detail Monitor**.
- **Highlight Transient Recovery**:
  - Inspect the Step labeled: *"SIMULATE TRANSIENT FAILURE AND RECOVER"*.
  - Show how the carrier webhook sync experienced an initial transient 504 network timeout, automatically classified the error, applied exponential backoff, and recovered on retry!
- **Highlight Independent Verification Evidence**:
  - Expand the green **Verified** badge.
  - Show the Verification Dossier: *"FlowPilot does not trust the AI's verbal word. It directly queries the database to confirm that the RestockRequest and Shipment records actually exist with the expected SKU and quantity."*

---

## 4:00 – 4:30: Immutable Audit Provenance & Conclusion
- **Action**: Navigate to **Audit History** (`/audit`).
- **Highlight**:
  - Show the complete, tamper-resistant trail: `WORKFLOW_CREATED` → `PLAN_GENERATED` → `APPROVAL_REQUESTED` → `APPROVAL_GRANTED` → `TOOL_EXECUTED` → `RECOVERY_COMPLETED` → `WORKFLOW_COMPLETED`.
- **Closing**: *"FlowPilot AI: from business problems to verified outcomes, with minimal manual coordination."*

