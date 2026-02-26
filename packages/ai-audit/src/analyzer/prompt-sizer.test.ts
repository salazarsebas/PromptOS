import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { estimateCosts } from '../estimator/index.js';
import { releaseAllSourceFiles, scanDeep } from '../scanner/index.js';
import { resolveAnalyzerConfig } from './context.js';
import { detectOversizedPrompts } from './prompt-sizer.js';
import { filterCallsWithEstimates } from './test-helpers.js';

const FIXTURE_DIR = resolve(import.meta.dirname, '../../test/__fixtures__');

describe('prompt-sizer', () => {
  it('detects oversized prompts exceeding threshold', async () => {
    const { scanResult, sourceFiles } = await scanDeep(FIXTURE_DIR);

    try {
      const costReport = estimateCosts(scanResult, {
        callsPerMonth: 1000,
        avgInputTokens: 500,
        avgOutputTokens: 200,
      });

      const { calls, estimates } = filterCallsWithEstimates(scanResult.calls, costReport, (c) =>
        c.filePath.includes('oversized-prompt'),
      );

      const opportunities = detectOversizedPrompts({
        calls,
        costEstimates: estimates,
        sourceFiles,
        config: resolveAnalyzerConfig({ promptTokenThreshold: 200 }),
      });

      expect(opportunities.length).toBeGreaterThanOrEqual(1);

      const first = opportunities[0];
      expect(first).toBeDefined();
      expect(first?.type).toBe('oversized-prompt');
      expect(first?.description).toContain('tokens');
      expect(first?.description).toContain('over budget');
      expect(first?.suggestion).toContain('compressing');
    } finally {
      releaseAllSourceFiles(sourceFiles);
    }
  });

  it('does not flag prompts under threshold', async () => {
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

      const opportunities = detectOversizedPrompts({
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
