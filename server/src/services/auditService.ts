import { prisma } from '../database/db.js';

export interface AuditLogParams {
  eventType: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  workflowId?: string;
  entityType?: string;
  entityId?: string;
  outcome?: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'DENIED';
  details?: Record<string, any>;
  ipAddress?: string;
}

export class AuditService {
  static async log(params: AuditLogParams) {
    try {
      // Strip any sensitive keys like passwords or secrets before persisting
      const sanitizedDetails = params.details ? this.sanitize(params.details) : undefined;

      const event = await prisma.auditEvent.create({
        data: {
          eventType: params.eventType,
          actorId: params.actorId,
          actorEmail: params.actorEmail,
          actorRole: params.actorRole,
          workflowId: params.workflowId,
          entityType: params.entityType,
          entityId: params.entityId,
          outcome: params.outcome || 'SUCCESS',
          details: sanitizedDetails ? JSON.stringify(sanitizedDetails) : null,
          ipAddress: params.ipAddress,
        },
      });
      return event;
    } catch (err) {
      console.error('[AuditService.log Error]', err);
      return null;
    }
  }

  private static sanitize(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.sanitize(item));

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (/password|secret|token|apiKey|key/i.test(key)) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = this.sanitize(value);
      }
    }
    return clean;
  }
}

