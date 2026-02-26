import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { estimateCosts } from '../estimator/index.js';
import { releaseAllSourceFiles, scanDeep } from '../scanner/index.js';
import { resolveAnalyzerConfig } from './context.js';
import { detectRedundancy } from './redundancy-detector.js';
import { filterCallsWithEstimates } from './test-helpers.js';

const FIXTURE_DIR = resolve(import.meta.dirname, '../../test/__fixtures__');

describe('redundancy-detector', () => {
  it('detects repeated system prompts across call sites', async () => {
    const { scanResult, sourceFiles } = await scanDeep(FIXTURE_DIR);

    try {
      const costReport = estimateCosts(scanResult, {
        callsPerMonth: 1000,
        avgInputTokens: 500,
        avgOutputTokens: 200,
      });

      const opportunities = detectRedundancy({
        calls: scanResult.calls,
        costEstimates: costReport.estimates,
        sourceFiles,
        config: resolveAnalyzerConfig({}),
      });

      const redundant = opportunities.filter((o) => o.type === 'redundant-context');
      expect(redundant.length).toBeGreaterThanOrEqual(1);

      const first = redundant[0];
      expect(first).toBeDefined();
      expect(first?.severity).toBe('high');
      expect(first?.description).toContain('duplicated across');
      expect(first?.suggestion).toContain('constant');
      expect(first?.estimatedMonthlySavingsUSD).toBeGreaterThan(0);
    } finally {
      releaseAllSourceFiles(sourceFiles);
    }
  });

  it('does not flag unique system prompts', async () => {
    const { scanResult, sourceFiles } = await scanDeep(FIXTURE_DIR);

    try {
      const costReport = estimateCosts(scanResult, {
        callsPerMonth: 1000,
        avgInputTokens: 500,
        avgOutputTokens: 200,
      });

      const { calls, estimates } = filterCallsWithEstimates(scanResult.calls, costReport, (c) =>
        c.filePath.includes('anthropic-usage'),
      );

      const opportunities = detectRedundancy({
        calls,
        costEstimates: estimates,
        sourceFiles,
        config: resolveAnalyzerConfig({}),
      });

      expect(opportunities.length).toBe(0);
    } finally {
      releaseAllSourceFiles(sourceFiles);
    }
  });
});
