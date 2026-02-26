import type { AuditReport, ReportFormat } from '@promptos/shared';
import { formatJson } from './json.js';
import { formatTerminal } from './terminal.js';

export function formatReport(report: AuditReport, format: ReportFormat): string {
  switch (format) {
    case 'terminal':
      return formatTerminal(report);
    case 'json':
      return formatJson(report);
    default:
      throw new Error(`Unknown format: ${format satisfies never}`);
  }
}
