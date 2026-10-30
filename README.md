# FlowPilot AI — Autonomous Business Operations Agent

> **"From business problems to verified outcomes, with minimal manual coordination."**

FlowPilot AI is a production-style enterprise operations platform that automates the investigation, planning, approval, execution, and verification of complex operational workflows.

---

## 1. Problem Statement

Modern enterprise business operations (supply chain fulfillment, inventory reordering, logistics coordination) are bottlenecked by manual human coordination:
- Operators constantly context-switch across disconnected ERP, WMS, and carrier systems.
- When orders are delayed, investigating the root cause (inventory deficit vs carrier exception vs missing customs documentation) takes hours of manual queries.
- Corrective actions either require manual intervention or risk executing unchecked automations without appropriate human authorization.
- Traditional "AI chatbots" produce verbal advice without backend guardrails, deterministic policy checks, or independent verification that an action actually worked.

---

## 2. Proposed Solution

FlowPilot AI introduces an autonomous, governed agent architecture following a strict operational lifecycle:
```
DETECT → INVESTIGATE → PLAN → VALIDATE → APPROVE → EXECUTE → VERIFY → RECOVER OR COMPLETE
```

### Core Tenets:
1. **Clear Separation of Concerns**:
   - AI proposes plans; deterministic backend policies authorize them.
   - Low-risk actions execute automatically; high-risk actions halt at human authorization gates.
2. **Independent Result Verification**:
   - The platform never trusts an LLM's verbal statement that an action succeeded.
   - The **Verification Service** directly inspects the relational database to verify that the expected side effects occurred.
3. **Resilient Failure Recovery**:
   - Transient network issues (e.g., 504 timeouts) are classified and retried safely with exponential backoff and idempotency safeguards.
4. **Complete Audit Provenance**:
   - Every action, approval decision, tool execution, and verification receipt is appended to an immutable audit log.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS (Enterprise SaaS aesthetic)
- **Routing**: React Router 7
- **Icons & Data Viz**: Lucide React + Recharts
- **State & HTTP**: Fetch API client with automatic JWT token management

### Backend
- **Runtime**: Node.js (v20+) + Express + TypeScript
- **Validation**: Zod (strict request & model output schemas)
- **Security**: bcryptjs password hashing, JSON Web Tokens (JWT), HttpOnly cookie session support
- **Architecture**: Modular layered services (Agents, Tools, Policies, Controllers)

### Database & Persistence
- **ORM**: Prisma ORM v6
- **Database Engine**: Persistent SQLite for seamless zero-dependency local development (`server/dev.db`), with immediate compatibility with PostgreSQL for production deployments.

### AI Integration
- **SDK**: Official `@google/genai` (Google Gemini 2.5 Flash)
- **Dual-Mode Engine**: Live Gemini reasoning when configured with an API key, and deterministic rule-based demo engine when running in Demo Mode (guarantees 100% functionality without a paid API key).

---

## 4. Project Structure

```
flowpilotai/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Layout, Navbar, Sidebar
│   │   ├── context/            # AuthContext & role handling
│   │   ├── pages/              # Dashboard, TaskCenter, Workflows, Approvals, Orders, Inventory, Audit, Analytics, Settings
│   │   ├── services/           # ApiClient
│   │   ├── types/              # Domain TypeScript interfaces
│   │   ├── App.tsx             # Route definitions
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Express + TypeScript Backend
│   ├── src/
│   │   ├── agents/             # Coordinator, Investigation, Planning, Execution, Verification, Recovery
│   │   ├── config/             # Environment validation
│   │   ├── controllers/        # REST route controllers
│   │   ├── database/           # Prisma client & database seeder
│   │   ├── middleware/         # Auth JWT & Error Handler
│   │   ├── routes/             # API Router mounts
│   │   ├── services/           # GeminiService, AuditService
│   │   ├── tools/              # ToolRegistry (13 backend tools)
│   │   ├── app.ts              # Express application setup
│   │   └── server.ts           # Server bootstrap
│   ├── prisma/
│   │   ├── schema.prisma       # Relational models
│   │   └── seed.ts             # Seeding execution script
│   ├── tests/                  # Integration test suite (Vitest + Supertest)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── docs/                       # Architecture, API, Security, Demo Script
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── SECURITY.md
│   └── DEMO_SCRIPT.md
├── package.json                # Root orchestration package
└── README.md
```

---

## 5. Prerequisites

- **Node.js**: v20 or newer (`node -v`)
- **npm**: v10 or newer (`npm -v`)

---

## 6. Installation & Quick Start

### Step 1: Install Dependencies
From the repository root:
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Return to root
cd ..
```

### Step 2: Initialize Database and Seed Demonstration Data
```bash
cd server
npx prisma db push
npx tsx prisma/seed.ts
cd ..
```
*Note: This creates `server/dev.db` and populates 16 realistic customer orders (with varied delay causes), 10 inventory SKUs, shipments, seeded workflows, and pending approvals.*

### Step 3: Run the Development Servers
In two separate terminal sessions:

**Terminal 1 (Backend Server on http://localhost:5000):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client on http://localhost:5173):**
```bash
cd client
npm run dev
```

Open your browser to **`http://localhost:5173`**.

---

## 7. Pre-Configured Demo Accounts

For hackathon evaluation, click any quick-fill button on the Login page:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **OPERATOR** | `operator@flowpilot.ai` | `OperatorPassword123!` | Trigger workflows, inspect orders & inventory |
| **MANAGER** | `manager@flowpilot.ai` | `ManagerPassword123!` | Authorize high-risk approvals, review reports |
| **ADMIN** | `admin@flowpilot.ai` | `AdminPassword123!` | System configuration, database reseed, full governance |

---

## 8. AI Modes & Environment Configuration

### Option A: Deterministic Demo Mode (Default, Zero-Config)
The application works out-of-the-box without requiring any external API key. In demo mode:
- Orders are classified via deterministic business logic.
- Action plans and findings match exact real database states.
- All backend tool calls, transient failure recovery, and verification checks run natively.
- Marked clearly with a **"Demo Mode"** badge in the interface.

### Option B: Live Google Gemini 2.5 Flash
To activate live LLM planning:
1. Open `server/.env`.
2. Provide your Gemini API key:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   ENABLE_DEMO_MODE=false
   AI_MODEL="gemini-2.5-flash"
   ```
3. Restart the server. FlowPilot AI will immediately use Google Gemini 2.5 Flash with structured JSON schemas!

---

## 9. Running Tests & Production Builds

### Run Backend Integration Tests
```bash
cd server
npm test
```
*Executes all 10 automated test suites covering authentication, role gating, tool execution, independent verification, and failure recovery.*

### Build Production Artifacts
```bash
# Build Backend TypeScript
cd server && npm run build

# Build Frontend Bundle
cd ../client && npm run build
```

---

## 10. Primary Hackathon Workflow: Intelligent Order Delay Resolution

1. **Sign in** as `operator@flowpilot.ai`.
2. Inspect the **Overview Dashboard** — notice 6 urgent delayed orders and real-time database KPIs.
3. Click **Launch AI Task** (or navigate to `/task-center`).
4. Select the primary scenario:
   > *"Investigate all delayed orders, identify their causes, prioritize them, and resolve the issues wherever possible."*
5. Select **Assisted Execution** and click **Launch Workflow Orchestration**.
6. The **Workflow Monitor** opens:
   - **Investigation Step**: Queries `getDelayedOrders`, detects inventory stock shortages for LiDAR sensors and carrier vehicle breakdowns.
   - **Planning Step**: Synthesizes structured corrective actions with risk levels and approval requirements.
   - **Approval Gate**: High-risk expedited logistics pauses at `AWAITING_APPROVAL`.
7. Switch roles to **MANAGER** using the top navigation bar.
8. Navigate to **Approval Center** (`/approvals`), inspect the order justification, and click **Authorize Action**.
9. In the Workflow Monitor, observe the workflow automatically resume, execute the tool, self-heal through a simulated carrier gateway timeout, and independently verify the resulting database state!
10. Navigate to **Audit History** (`/audit`) to inspect the immutable execution record.

---

## 11. Production Deployment Preparation

- **Frontend**: Deploy `client/dist` to Vercel, Netlify, or AWS CloudFront. Set `VITE_API_BASE_URL` to the backend URL.
- **Backend**: Deploy `server/` to Render, Railway, Fly.io, or Heroku.
- **Database**: Point `DATABASE_URL` to managed PostgreSQL. In `server/prisma/schema.prisma`, update provider to `postgresql`. Run `npx prisma db push`.
- **Health Check Endpoint**: Available at `GET /api/health`.

---

## 12. Security & Compliance Notes

- Plaintext secrets and API keys are never exposed in frontend bundles or logged to disk.
- All user input and AI suggestions are treated as untrusted and validated against strict allowlists.
- Sensitive actions require explicit human manager authorization.

