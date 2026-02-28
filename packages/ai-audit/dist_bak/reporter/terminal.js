import chalk from 'chalk';
import { capitalize } from './utils.js';
export function formatTerminal(report) {
  const lines = [];
  const { scan, cost } = report;
  lines.push('');
  lines.push(chalk.bold.cyan('PromptOS AI Audit Report'));
  lines.push(chalk.cyan('========================'));
  lines.push(`Scanned: ${scan.scannedFiles} files (${(scan.scanDurationMs / 1000).toFixed(1)}s)`);
  if (scan.skippedFiles > 0) {
    lines.push(chalk.yellow(`Skipped: ${scan.skippedFiles} files (errors)`));
  }
  lines.push('');
  if (scan.totalCalls === 0) {
    lines.push(chalk.dim('No LLM API calls detected.'));
    lines.push('');
    return lines.join('\n');
  }
  // Provider breakdown
  lines.push(chalk.bold('Provider Usage:'));
  for (const [name, summary] of Object.entries(cost.byProvider)) {
    const categoryCounts = getCategoryCounts(report, name);
    lines.push(
      `  ${padRight(capitalize(name), 14)} ${summary.callCount} calls  (${categoryCounts})`,
    );
  }
  lines.push('');
  // Cost summary
  lines.push(
    chalk.bold(`Estimated Monthly Cost: ${chalk.green(`$${cost.totalMonthlyCostUSD.toFixed(2)}`)}`),
  );
  for (const [name, summary] of Object.entries(cost.byProvider)) {
    lines.push(
      `  ${padRight(`${capitalize(name)}:`, 14)} $${summary.totalMonthlyCostUSD.toFixed(2)} (${summary.percentage}%)`,
    );
  }
  lines.push('');
  // Top cost drivers
  if (cost.topCostDrivers.length > 0) {
    lines.push(chalk.bold('Top Cost Drivers:'));
    const limit = Math.min(5, cost.topCostDrivers.length);
    for (let i = 0; i < limit; i++) {
      const driver = cost.topCostDrivers[i];
      if (!driver) continue;
      const call = scan.calls[driver.callIndex];
      if (!call) continue;
      const location = `${call.filePath}:${call.line}`;
      lines.push(
        `  ${i + 1}. ${padRight(location, 40)} ${padRight(call.method, 36)} ~$${driver.monthlyCostUSD.toFixed(2)}/mo`,
      );
    }
  }
  // Deep analysis
  if (report.deepAnalysis) {
    lines.push('');
    addDeepAnalysisSection(lines, report.deepAnalysis);
  }
  lines.push('');
  return lines.join('\n');
}
function addDeepAnalysisSection(lines, deepAnalysis) {
  const { opportunities, totalEstimatedSavingsUSD } = deepAnalysis;
  lines.push(chalk.bold.yellow('Optimization Opportunities:'));
  lines.push(
    `  ${opportunities.length} found — estimated savings: ${chalk.green(`$${totalEstimatedSavingsUSD.toFixed(2)}/month`)}`,
  );
  lines.push('');
  for (const opp of opportunities) {
    const severity = formatSeverity(opp.severity);
    lines.push(`  ${severity} ${chalk.bold(opp.type)}`);
    lines.push(`    ${opp.filePath}:${opp.line}`);
    lines.push(`    ${opp.description}`);
    lines.push(chalk.dim(`    → ${opp.suggestion}`));
    lines.push(chalk.green(`    ~$${opp.estimatedMonthlySavingsUSD.toFixed(2)}/mo savings`));
    lines.push('');
  }
}
function formatSeverity(severity) {
  switch (severity) {
    case 'high':
      return chalk.red.bold('[HIGH]');
    case 'medium':
      return chalk.yellow.bold('[MED]');
    default:
      return chalk.dim('[LOW]');
  }
}
function padRight(str, length) {
  return str.length >= length ? str : str + ' '.repeat(length - str.length);
}
function getCategoryCounts(report, providerName) {
  const counts = {};
  for (const call of report.scan.calls) {
    if (call.provider === providerName) {
      counts[call.category] = (counts[call.category] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([cat, count]) => `${cat}: ${count}`)
    .join(', ');
}
//# sourceMappingURL=terminal.js.map
