import type { AuditReport } from '@promptos/shared';
import { capitalize } from './utils.js';

export function formatHtml(report: AuditReport): string {
  const { scan, cost } = report;

  const providerRows = Object.entries(cost.byProvider)
    .map(
      ([name, summary]) =>
        `<tr>
          <td>${escapeHtml(capitalize(name))}</td>
          <td>${summary.callCount}</td>
          <td>$${summary.totalMonthlyCostUSD.toFixed(2)}</td>
          <td>
            <div class="bar-container">
              <div class="bar" style="width:${summary.percentage}%"></div>
              <span class="bar-label">${summary.percentage}%</span>
            </div>
          </td>
        </tr>`,
    )
    .join('\n');

  const driverRows = cost.topCostDrivers
    .slice(0, 10)
    .map((driver, i) => {
      const call = scan.calls[driver.callIndex];
      if (!call) return '';
      return `<tr>
        <td>${i + 1}</td>
        <td><code>${escapeHtml(call.filePath)}:${call.line}</code></td>
        <td><code>${escapeHtml(call.method)}</code></td>
        <td>$${driver.monthlyCostUSD.toFixed(2)}</td>
      </tr>`;
    })
    .join('\n');

  let deepAnalysisSection = '';
  if (report.deepAnalysis) {
    const { opportunities, totalEstimatedSavingsUSD } = report.deepAnalysis;
    const oppRows = opportunities
      .map(
        (opp) =>
          `<tr>
            <td><span class="severity severity-${opp.severity}">${opp.severity.toUpperCase()}</span></td>
            <td>${escapeHtml(opp.type)}</td>
            <td><code>${escapeHtml(opp.filePath)}:${opp.line}</code></td>
            <td>${escapeHtml(opp.description)}</td>
            <td>$${opp.estimatedMonthlySavingsUSD.toFixed(2)}/mo</td>
          </tr>`,
      )
      .join('\n');

    deepAnalysisSection = `
    <section>
      <h2>Optimization Opportunities</h2>
      <p class="highlight">${opportunities.length} opportunities found — estimated savings: <strong>$${totalEstimatedSavingsUSD.toFixed(2)}/month</strong></p>
      ${
        opportunities.length > 0
          ? `<table>
            <thead>
              <tr><th>Severity</th><th>Type</th><th>Location</th><th>Description</th><th>Est. Savings</th></tr>
            </thead>
            <tbody>${oppRows}</tbody>
          </table>`
          : ''
      }
    </section>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PromptOS AI Audit Report</title>
  <style>
    :root {
      --bg: #0f1117;
      --surface: #1a1d27;
      --border: #2a2d3a;
      --text: #e1e4ed;
      --text-secondary: #8b90a0;
      --accent: #6366f1;
      --green: #22c55e;
      --yellow: #eab308;
      --red: #ef4444;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; padding: 2rem; }
    .container { max-width: 960px; margin: 0 auto; }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; color: var(--accent); }
    h2 { font-size: 1.25rem; margin: 2rem 0 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    .subtitle { color: var(--text-secondary); margin-bottom: 2rem; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; }
    .card-label { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
    .card-value { font-size: 1.5rem; font-weight: 600; }
    .card-value.cost { color: var(--green); }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--border); }
    th { font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    tr:hover { background: var(--surface); }
    code { background: var(--surface); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85rem; }
    .bar-container { display: flex; align-items: center; gap: 0.5rem; }
    .bar { height: 8px; background: var(--accent); border-radius: 4px; min-width: 2px; }
    .bar-label { font-size: 0.85rem; color: var(--text-secondary); }
    .severity { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .severity-high { background: var(--red); color: white; }
    .severity-medium { background: var(--yellow); color: #1a1d27; }
    .severity-low { background: var(--border); color: var(--text); }
    .highlight { background: var(--surface); border-left: 3px solid var(--accent); padding: 0.75rem 1rem; margin-bottom: 1rem; border-radius: 0 4px 4px 0; }
    .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--text-secondary); font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>PromptOS AI Audit Report</h1>
    <p class="subtitle">Generated on ${escapeHtml(report.timestamp)}</p>

    <div class="summary-grid">
      <div class="card">
        <div class="card-label">Files Scanned</div>
        <div class="card-value">${scan.scannedFiles}</div>
      </div>
      <div class="card">
        <div class="card-label">API Calls Detected</div>
        <div class="card-value">${scan.totalCalls}</div>
      </div>
      <div class="card">
        <div class="card-label">Estimated Monthly Cost</div>
        <div class="card-value cost">$${cost.totalMonthlyCostUSD.toFixed(2)}</div>
      </div>
      <div class="card">
        <div class="card-label">Scan Duration</div>
        <div class="card-value">${(scan.scanDurationMs / 1000).toFixed(1)}s</div>
      </div>
    </div>

    ${
      scan.totalCalls > 0
        ? `
    <section>
      <h2>Provider Usage</h2>
      <table>
        <thead>
          <tr><th>Provider</th><th>Calls</th><th>Monthly Cost</th><th>Share</th></tr>
        </thead>
        <tbody>${providerRows}</tbody>
      </table>
    </section>

    <section>
      <h2>Top Cost Drivers</h2>
      <table>
        <thead>
          <tr><th>#</th><th>Location</th><th>Method</th><th>Monthly Cost</th></tr>
        </thead>
        <tbody>${driverRows}</tbody>
      </table>
    </section>

    ${deepAnalysisSection}
    `
        : '<p>No LLM API calls detected.</p>'
    }

    <div class="footer">
      PromptOS v${escapeHtml(report.version)} &middot; Target: <code>${escapeHtml(report.targetPath)}</code>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
