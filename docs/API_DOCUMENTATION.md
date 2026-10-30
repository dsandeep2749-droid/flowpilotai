# FlowPilot AI — API Reference Documentation

All endpoints are served from `/api`. Protected routes require a valid JWT token via standard `Authorization: Bearer <token>` header or `flowpilot_token` cookie.

---

## 1. Authentication

### `POST /api/auth/register`
Creates a new operator, manager, or admin user.
- **Request Body**:
  ```json
  {
    "name": "Alex Rivera",
    "email": "alex@flowpilot.ai",
    "password": "Password123!",
    "role": "OPERATOR"
  }
  ```
- **Response**: `{ "user": { ... }, "token": "jwt..." }`

### `POST /api/auth/login`
Authenticates a user and issues a JWT token.
- **Request Body**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "user": { ... }, "token": "jwt..." }`

### `GET /api/auth/me`
Returns the currently authenticated user profile and assigned role.

### `POST /api/auth/logout`
Clears session cookies and logs the user logout event.

---

## 2. Dashboard & Telemetry

### `GET /api/dashboard/summary`
Calculates real-time KPI metrics, execution trends, delayed orders summary, and pending approvals directly from database records.

---

## 3. Workflows

### `POST /api/workflows`
Initiates an autonomous operational workflow.
- **Request Body**:
  ```json
  {
    "objective": "Investigate delayed orders, identify causes, and resolve issues.",
    "executionMode": "ASSISTED",
    "workflowType": "ORDER_DELAY_RESOLUTION"
  }
  ```
- **Response**: `{ "workflow": { "id": "...", "status": "QUEUED" } }`

### `GET /api/workflows`
Returns paginated list of workflows. Supports `status` and `mode` query filters.

### `GET /api/workflows/:id`
Retrieves comprehensive workflow dossier including:
- High-level objective & synthesized plan.
- Step-by-step timeline with inputs, outputs, retry counters, and verification evidence.
- Associated approval requests and tool execution audit records.

### `POST /api/workflows/:id/cancel`
Cancels an active or paused workflow.

### `POST /api/workflows/:id/retry`
Re-queues and restarts a failed workflow.

---

## 4. Approvals

### `GET /api/approvals`
Lists pending, approved, or rejected approval requests.

### `POST /api/approvals/:id/approve`
Authorizes a sensitive workflow action.
- **Access**: `MANAGER` or `ADMIN` role required.
- **Request Body**: `{ "comment": "Approved for emergency dispatch." }`
- **Side Effect**: Automatically resumes workflow execution.

### `POST /api/approvals/:id/reject`
Rejects a requested action.
- **Access**: `MANAGER` or `ADMIN` role required.
- **Request Body**: `{ "comment": "Rejection explanation (mandatory)." }`

---

## 5. Orders & Inventory

### `GET /api/orders`
Retrieves customer orders with search, status, priority, and `delayedOnly=true` filters.

### `GET /api/inventory`
Retrieves warehouse inventory records, stock deficits, and `lowStockOnly=true` filter.

---

## 6. Audit & Analytics

### `GET /api/audit-events`
Returns immutable append-oriented audit logs. Filterable by `eventType` and `actorEmail`.

### `GET /api/analytics/summary`
Calculates success/failure rates, average lead times, outcome verification rates, and approval turnarounds.

