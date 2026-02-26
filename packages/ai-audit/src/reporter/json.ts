import type { AuditReport } from '@promptos/shared';

export function formatJson(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}
