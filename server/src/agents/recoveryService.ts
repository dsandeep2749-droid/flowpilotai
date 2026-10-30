import { AuditService } from '../services/auditService.js';

export interface RecoveryDecision {
  shouldRetry: boolean;
  reason: string;
  delayMs: number;
}

export class RecoveryService {
  static evaluate(error: string, currentRetryCount: number, maxRetries: number = 3): RecoveryDecision {
    if (currentRetryCount >= maxRetries) {
      return {
        shouldRetry: false,
        reason: `Maximum retry limit (${maxRetries}) reached. Escalating failure for human operator review.`,
        delayMs: 0,
      };
    }

    // Classify transient errors (network timeouts, 503, 504, rate limits, lock contentions)
    const isTransient =
      /timeout|504|503|econnreset|transient|rate limit|locked/i.test(error);

    if (isTransient) {
      // Exponential backoff: 300ms, 600ms, 1200ms
      const delayMs = Math.min(300 * Math.pow(2, currentRetryCount), 3000);
      return {
        shouldRetry: true,
        reason: `Transient failure detected (${error}). Executing automated recovery retry ${currentRetryCount + 1}/${maxRetries}.`,
        delayMs,
      };
    }

    return {
      shouldRetry: false,
      reason: `Permanent error detected (${error}). Retrying will not resolve this issue.`,
      delayMs: 0,
    };
  }
}

