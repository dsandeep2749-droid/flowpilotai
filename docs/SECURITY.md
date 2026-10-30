# FlowPilot AI — Security Architecture & Governance

## 1. Threat Model & Design Principles

FlowPilot AI operates with a zero-trust model for AI-generated outputs:
1. **Model Output is Untrusted**: Instructions returned by LLMs are strictly validated against pre-compiled Zod schemas before any execution logic receives them.
2. **No Arbitrary Code Execution**: The agent cannot evaluate arbitrary code, shell commands, dynamic SQL, or file system modifications. Only pre-registered tools on a strict allowlist can be invoked.
3. **Defense-in-Depth Authorization**: Workflow actions are guarded by backend role checks (`OPERATOR`, `MANAGER`, `ADMIN`). Even if an LLM marks an action as "approved", the backend enforces human approval requirements.

---

## 2. Authentication & Session Management

- **Password Hashing**: Bcrypt with salt factor 10. Plaintext passwords are never persisted or printed in logs.
- **JWT Protection**: Short-lived tokens with 7-day expiration, signed with server-side secrets.
- **Transport Security**: CORS strictly configured to allow only the authorized frontend origin. Cookies use `HttpOnly` and `SameSite=Lax`.

---

## 3. Role-Based Access Control (RBAC)

| Capability | OPERATOR | MANAGER | ADMIN |
| :--- | :---: | :---: | :---: |
| Inspect Orders & Inventory | Yes | Yes | Yes |
| Launch AI Workflows | Yes | Yes | Yes |
| Inspect Workflow Timelines | Yes | Yes | Yes |
| Authorize / Reject High-Risk Actions | No | Yes | Yes |
| Reseed Demonstration Data | No | No | Yes |
| System Configuration | No | No | Yes |

---

## 4. Audit Trail & Sanitization

All significant lifecycle events are appended to the `AuditEvent` database table:
- Redaction of sensitive keys (`password`, `secret`, `token`, `apiKey`).
- Non-repudiation of approvals with timestamps, actor IDs, and justification text.
- Prevention of client-side tampering through append-only API interfaces.

