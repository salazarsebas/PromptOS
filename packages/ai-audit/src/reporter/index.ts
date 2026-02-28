import type { AuditReport, ReportFormat } from '@prompt-os/shared';
import { formatHtml } from './html.js';
import { formatJson } from './json.js';
import { formatMarkdown } from './markdown.js';
import { formatTerminal } from './terminal.js';

export function formatReport(report: AuditReport, format: ReportFormat): string {
  switch (format) {
    case 'terminal':
      return formatTerminal(report);
    case 'json':
      return formatJson(report);
    case 'markdown':
      return formatMarkdown(report);
    case 'html':
      return formatHtml(report);
    default:
      throw new Error(`Unknown format: ${format satisfies never}`);
  }
}
