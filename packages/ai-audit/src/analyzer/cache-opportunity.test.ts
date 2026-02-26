import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { estimateCosts } from '../estimator/index.js';
import { releaseAllSourceFiles, scanDeep } from '../scanner/index.js';
import { detectCacheOpportunities } from './cache-opportunity.js';
import { resolveAnalyzerConfig } from './context.js';
import { filterCallsWithEstimates } from './test-helpers.js';

const FIXTURE_DIR = resolve(import.meta.dirname, '../../test/__fixtures__');

describe('cache-opportunity', () => {
  it('detects LLM calls inside loops', async () => {
    const { scanResult, sourceFiles } = await scanDeep(FIXTURE_DIR);

    try {
      const costReport = estimateCosts(scanResult, {
        callsPerMonth: 1000,
        avgInputTokens: 500,
        avgOutputTokens: 200,
      });

      const { calls, estimates } = filterCallsWithEstimates(scanResult.calls, costReport, (c) =>
        c.filePath.includes('loop-calls'),
      );

      const opportunities = detectCacheOpportunities({
        calls,
        costEstimates: estimates,
        sourceFiles,
        config: resolveAnalyzerConfig({}),
      });

      expect(opportunities.length).toBeGreaterThanOrEqual(1);

      const first = opportunities[0];
      expect(first).toBeDefined();
      expect(first?.type).toBe('missing-cache');
      expect(first?.severity).toBe('high');
      expect(first?.description).toContain('loop');
      expect(first?.estimatedMonthlySavingsUSD).toBeGreaterThan(0);
    } finally {
      releaseAllSourceFiles(sourceFiles);
    }
  });

  it('detects LLM calls inside array iteration methods', async () => {
    const { scanResult, sourceFiles } = await scanDeep(FIXTURE_DIR);

    try {
      const costReport = estimateCosts(scanResult, {
        callsPerMonth: 1000,
        avgInputTokens: 500,
        avgOutputTokens: 200,
      });

      const { calls, estimates } = filterCallsWithEstimates(scanResult.calls, costReport, (c) =>
        c.filePath.includes('loop-calls'),
      );

      const opportunities = detectCacheOpportunities({
        calls,
        costEstimates: estimates,
        sourceFiles,
        config: resolveAnalyzerConfig({}),
      });

      // Should detect both the for-of loop and the .map() callback
      expect(opportunities.length).toBeGreaterThanOrEqual(2);
    } finally {
      releaseAllSourceFiles(sourceFiles);
    }
  });
});
