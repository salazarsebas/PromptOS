import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { estimateCosts } from '../estimator/index.js';
import { releaseAllSourceFiles, scanDeep } from '../scanner/index.js';
import { resolveAnalyzerConfig } from './context.js';
import { runAnalyzers } from './registry.js';

const FIXTURE_DIR = resolve(import.meta.dirname, '../../test/__fixtures__');

describe('runAnalyzers', () => {
  it('runs all registered analyzers and returns combined results', async () => {
    const { scanResult, sourceFiles } = await scanDeep(FIXTURE_DIR);

    try {
      const costReport = estimateCosts(scanResult, {
        callsPerMonth: 1000,
        avgInputTokens: 500,
        avgOutputTokens: 200,
      });

      const result = runAnalyzers({
        calls: scanResult.calls,
        costEstimates: costReport.estimates,
        sourceFiles,
        config: resolveAnalyzerConfig({ promptTokenThreshold: 200 }),
      });

      expect(result.opportunities.length).toBeGreaterThan(0);
      expect(result.totalEstimatedSavingsUSD).toBeGreaterThan(0);

      // Verify opportunities are sorted by savings (descending)
      for (let i = 1; i < result.opportunities.length; i++) {
        expect(result.opportunities[i]?.estimatedMonthlySavingsUSD).toBeLessThanOrEqual(
          result.opportunities[i - 1]?.estimatedMonthlySavingsUSD,
        );
      }

      // Verify multiple types are present
      const types = new Set(result.opportunities.map((o) => o.type));
      expect(types.size).toBeGreaterThanOrEqual(2);
    } finally {
      releaseAllSourceFiles(sourceFiles);
    }
  });

  it('returns empty results when no opportunities found', async () => {
    const { scanResult, sourceFiles } = await scanDeep(FIXTURE_DIR);

    try {
      // Filter to only calls that won't trigger any analyzers
      const noOpCalls = scanResult.calls.filter((c) => c.filePath.includes('no-llm-calls'));

      const result = runAnalyzers({
        calls: noOpCalls,
        costEstimates: [],
        sourceFiles,
        config: resolveAnalyzerConfig({}),
      });

      expect(result.opportunities.length).toBe(0);
      expect(result.totalEstimatedSavingsUSD).toBe(0);
    } finally {
      releaseAllSourceFiles(sourceFiles);
    }
  });
});
