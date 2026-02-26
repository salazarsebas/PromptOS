import { access, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { ReportFormat } from '@promptos/shared';
import { Command } from 'commander';
import { estimateCosts } from './estimator/index.js';
import { formatReport } from './reporter/index.js';
import { scan } from './scanner/index.js';

const VERSION = '0.1.0';

const VALID_FORMATS = new Set<ReportFormat>(['terminal', 'json']);

export const cli = new Command()
  .name('ai-audit')
  .description('Scan your codebase for LLM API usage and estimate costs')
  .version(VERSION)
  .argument('<directory>', 'Directory to scan')
  .option('-f, --format <format>', 'Output format: terminal, json', 'terminal')
  .option('-o, --output <path>', 'Write report to file')
  .option('--calls-per-month <number>', 'Assumed calls per month per call site', '1000')
  .option('--avg-input-tokens <number>', 'Assumed avg input tokens per call', '500')
  .option('--avg-output-tokens <number>', 'Assumed avg output tokens per call', '200')
  .action(async (directory: string, options) => {
    const targetPath = resolve(directory);
    const format = options.format as ReportFormat;

    if (!VALID_FORMATS.has(format)) {
      console.error(
        `Error: Invalid format "${format}". Valid formats: ${[...VALID_FORMATS].join(', ')}`,
      );
      process.exit(1);
    }

    try {
      await access(targetPath);
    } catch {
      console.error(`Error: Directory not found: ${targetPath}`);
      process.exit(1);
    }

    try {
      const scanResult = await scan(targetPath);
      const costReport = estimateCosts(scanResult, {
        callsPerMonth: Number(options.callsPerMonth),
        avgInputTokens: Number(options.avgInputTokens),
        avgOutputTokens: Number(options.avgOutputTokens),
      });

      const report = {
        version: VERSION,
        timestamp: new Date().toISOString(),
        targetPath,
        scan: scanResult,
        cost: costReport,
      };

      const output = formatReport(report, format);

      if (options.output) {
        await writeFile(options.output, output, 'utf-8');
      } else {
        console.log(output);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });
