import { estimateCosts, formatReport, scan } from '@promptos/ai-audit';
import type { AuditReport, ReportFormat } from '@promptos/shared';

const targetPath = process.argv[2] || '.';
const format = (process.argv[3] as ReportFormat) || 'terminal';

console.log(`Scanning ${targetPath} for LLM API calls...\n`);

const scanResult = await scan(targetPath);

console.log(`Scanned ${scanResult.scannedFiles} files`);
console.log(`Found ${scanResult.totalCalls} LLM API calls`);
console.log(`Scan took ${scanResult.scanDurationMs}ms\n`);

if (scanResult.totalCalls === 0) {
  console.log('No LLM API calls detected.');
  process.exit(0);
}

const costReport = estimateCosts(scanResult, {
  callsPerMonth: 10_000,
  avgInputTokens: 500,
  avgOutputTokens: 200,
});

console.log(`Estimated monthly cost: $${costReport.totalMonthlyCostUSD.toFixed(2)}\n`);

const report: AuditReport = {
  version: '0.1.0',
  timestamp: new Date().toISOString(),
  targetPath,
  scan: scanResult,
  cost: costReport,
};

console.log(formatReport(report, format));
