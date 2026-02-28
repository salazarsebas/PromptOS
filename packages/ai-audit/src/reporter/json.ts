import type { AuditReport } from '@prompt-os/shared';

export function formatJson(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}
