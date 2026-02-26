import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { estimateCosts } from '../estimator/index.js';
import { releaseAllSourceFiles, scanDeep } from '../scanner/index.js';
import { resolveAnalyzerConfig } from './context.js';
import { suggestModelDowngrades } from './model-suggester.js';
import { filterCallsWithEstimates } from './test-helpers.js';

const FIXTURE_DIR = resolve(import.meta.dirname, '../../test/__fixtures__');

describe('model-suggester', () => {
  it('suggests downgrades for expensive models with short prompts', async () => {
    const { scanResult, sourceFiles } = await scanDeep(FIXTURE_DIR);

    try {
      const costReport = estimateCosts(scanResult, {
        callsPerMonth: 1000,
        avgInputTokens: 500,
        avgOutputTokens: 200,
      });

      const { calls, estimates } = filterCallsWithEstimates(scanResult.calls, costReport, (c) =>
        c.filePath.includes('expensive-simple'),
      );

      const opportunities = suggestModelDowngrades({
        calls,
        costEstimates: estimates,
        sourceFiles,
        config: resolveAnalyzerConfig({}),
      });

      expect(opportunities.length).toBeGreaterThanOrEqual(1);

      const gptDowngrade = opportunities.find((o) => o.description.includes('gpt-4o'));
      expect(gptDowngrade).toBeDefined();
      expect(gptDowngrade?.type).toBe('model-downgrade');
      expect(gptDowngrade?.suggestion).toContain('gpt-4o-mini');
      expect(gptDowngrade?.estimatedMonthlySavingsUSD).toBeGreaterThan(0);
    } finally {
      releaseAllSourceFiles(sourceFiles);
    }
  });

  it('does not suggest downgrades for already-cheap models', async () => {
    const { scanResult, sourceFiles } = await scanDeep(FIXTURE_DIR);

    try {
      const costReport = estimateCosts(scanResult, {
        callsPerMonth: 1000,
        avgInputTokens: 500,
        avgOutputTokens: 200,
      });

      const { calls, estimates } = filterCallsWithEstimates(
        scanResult.calls,
        costReport,
        (c) => c.inferredModel === 'gpt-4o-mini',
      );

      const opportunities = suggestModelDowngrades({
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
