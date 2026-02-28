import { formatHtml } from './html.js';
import { formatJson } from './json.js';
import { formatMarkdown } from './markdown.js';
import { formatTerminal } from './terminal.js';
export function formatReport(report, format) {
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
      throw new Error(`Unknown format: ${format}`);
  }
}
//# sourceMappingURL=index.js.map
