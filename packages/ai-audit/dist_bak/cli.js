import { stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { resolveAnalyzerConfig, runAnalyzers } from './analyzer/index.js';
import { loadConfig } from './config/loader.js';
import { estimateCosts } from './estimator/index.js';
import { formatReport } from './reporter/index.js';
import { releaseAllSourceFiles, scan, scanDeep } from './scanner/index.js';

const VERSION = '0.1.0';
const VALID_FORMATS = new Set(['terminal', 'json', 'markdown', 'html']);
export const cli = new Command()
  .name('ai-audit')
  .description('Scan your codebase for LLM API usage and estimate costs')
  .version(VERSION)
  .argument('<directory>', 'Directory to scan')
  .option('-f, --format <format>', 'Output format: terminal, json, markdown, html', 'terminal')
  .option('-o, --output <path>', 'Write report to file')
  .option('--deep', 'Run deep analysis to detect optimization opportunities')
  .option('--config <path>', 'Path to .promptosrc.json config file')
  .option('--calls-per-month <number>', 'Assumed calls per month per call site', '1000')
  .option('--avg-input-tokens <number>', 'Assumed avg input tokens per call', '500')
  .option('--avg-output-tokens <number>', 'Assumed avg output tokens per call', '200')
  .action(async (directory, options) => {
    const targetPath = resolve(directory);
    try {
      const stats = await stat(targetPath);
      if (!stats.isDirectory()) {
        console.error(`Error: Not a directory: ${targetPath}`);
        process.exit(1);
      }
    } catch {
      console.error(`Error: Directory not found: ${targetPath}`);
      process.exit(1);
    }
    // Load config and merge with CLI options (CLI wins)
    const config = await loadConfig(targetPath, options.config).catch(() => ({}));
    const format = options.format ?? config.format ?? 'terminal';
    const deep = options.deep ?? config.deep ?? false;
    if (!VALID_FORMATS.has(format)) {
      console.error(
        `Error: Invalid format "${format}". Valid formats: ${[...VALID_FORMATS].join(', ')}`,
      );
      process.exit(1);
    }
    const estimationOptions = {
      callsPerMonth: numericOption(options.callsPerMonth, config.callsPerMonth, 1000),
      avgInputTokens: numericOption(options.avgInputTokens, config.avgInputTokens, 500),
      avgOutputTokens: numericOption(options.avgOutputTokens, config.avgOutputTokens, 200),
    };
    const ignoreDirs = config.exclude ? new Set(config.exclude) : undefined;
    try {
      let report;
      if (deep) {
        const { scanResult, sourceFiles } = await scanDeep(targetPath, ignoreDirs);
        const costReport = estimateCosts(scanResult, estimationOptions);
        const analyzerConfig = resolveAnalyzerConfig({
          ...config,
          callsPerMonth: estimationOptions.callsPerMonth,
          avgInputTokens: estimationOptions.avgInputTokens,
          avgOutputTokens: estimationOptions.avgOutputTokens,
        });
        const deepAnalysis = runAnalyzers({
          calls: scanResult.calls,
          costEstimates: costReport.estimates,
          sourceFiles,
          config: analyzerConfig,
        });
        releaseAllSourceFiles(sourceFiles);
        report = {
          version: VERSION,
          timestamp: new Date().toISOString(),
          targetPath,
          scan: scanResult,
          cost: costReport,
          deepAnalysis,
        };
      } else {
        const scanResult = await scan(targetPath, ignoreDirs);
        const costReport = estimateCosts(scanResult, estimationOptions);
        report = {
          version: VERSION,
          timestamp: new Date().toISOString(),
          targetPath,
          scan: scanResult,
          cost: costReport,
        };
      }
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
function numericOption(cliValue, configValue, fallback) {
  if (cliValue !== undefined) {
    const n = Number(cliValue);
    if (!Number.isNaN(n)) return n;
  }
  return configValue ?? fallback;
}
//# sourceMappingURL=cli.js.map
