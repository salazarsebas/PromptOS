import type { AuditReport } from '@promptos/shared';
import { describe, expect, it } from 'vitest';
import { formatMarkdown } from './markdown.js';

function makeReport(overrides?: Partial<AuditReport>): AuditReport {
  return {
    version: '0.1.0',
    timestamp: '2025-01-15T10:00:00.000Z',
    targetPath: '/test/project',
    scan: {
      scannedFiles: 10,
      skippedFiles: 0,
      totalCalls: 3,
      calls: [
        {
          filePath: 'src/api.ts',
          line: 15,
          column: 5,
          provider: 'openai',
          method: 'openai.chat.completions.create',
          category: 'chat',
          modelArgument: 'gpt-4o',
          inferredModel: 'gpt-4o',
          contextSnippet: '...',
          confidence: 'high',
        },
        {
          filePath: 'src/embed.ts',
          line: 10,
          column: 5,
          provider: 'openai',
          method: 'openai.embeddings.create',
          category: 'embedding',
          modelArgument: 'text-embedding-3-small',
          inferredModel: 'text-embedding-3-small',
          contextSnippet: '...',
          confidence: 'high',
        },
        {
          filePath: 'src/chat.ts',
          line: 20,
          column: 5,
          provider: 'anthropic',
          method: 'anthropic.messages.create',
          category: 'chat',
          modelArgument: 'claude-sonnet-4-5',
          inferredModel: 'claude-sonnet-4-5',
          contextSnippet: '...',
          confidence: 'high',
        },
      ],
      scanDurationMs: 1234,
      errors: [],
    },
    cost: {
      totalMonthlyCostUSD: 15.5,
      byProvider: {
        openai: { provider: 'openai', totalMonthlyCostUSD: 5.5, callCount: 2, percentage: 35 },
        anthropic: {
          provider: 'anthropic',
          totalMonthlyCostUSD: 10.0,
          callCount: 1,
          percentage: 65,
        },
      },
      topCostDrivers: [
        {
          callIndex: 2,
          model: 'claude-sonnet-4-5',
          estimatedInputTokensPerCall: 500,
          estimatedOutputTokensPerCall: 200,
          estimatedCallsPerMonth: 1000,
          monthlyCostUSD: 10.0,
        },
      ],
      estimates: [],
    },
    ...overrides,
  };
}

describe('formatMarkdown', () => {
  it('produces valid markdown with tables', () => {
    const output = formatMarkdown(makeReport());

    expect(output).toContain('# PromptOS AI Audit Report');
    expect(output).toContain('## Summary');
    expect(output).toContain('| Files scanned | 10 |');
    expect(output).toContain('| **Estimated monthly cost** | **$15.50** |');
    expect(output).toContain('## Provider Usage');
    expect(output).toContain('| Openai | 2 | $5.50 | 35% |');
    expect(output).toContain('## Top Cost Drivers');
  });

  it('shows deep analysis section when present', () => {
    const output = formatMarkdown(
      makeReport({
        deepAnalysis: {
          opportunities: [
            {
              type: 'model-downgrade',
              severity: 'medium',
              filePath: 'src/api.ts',
              line: 15,
              description: 'gpt-4o used for short prompt',
              suggestion: 'Use gpt-4o-mini',
              estimatedMonthlySavingsUSD: 4.5,
            },
          ],
          totalEstimatedSavingsUSD: 4.5,
        },
      }),
    );

    expect(output).toContain('## Optimization Opportunities');
    expect(output).toContain('1 opportunities found');
    expect(output).toContain('$4.50/month');
    expect(output).toContain('model-downgrade');
    expect(output).toContain('$4.50/mo');
  });

  it('handles empty scan results', () => {
    const output = formatMarkdown(
      makeReport({
        scan: {
          scannedFiles: 5,
          skippedFiles: 0,
          totalCalls: 0,
          calls: [],
          scanDurationMs: 500,
          errors: [],
        },
        cost: {
          totalMonthlyCostUSD: 0,
          byProvider: {},
          topCostDrivers: [],
          estimates: [],
        },
      }),
    );

    expect(output).toContain('No LLM API calls detected');
    expect(output).not.toContain('## Provider Usage');
  });
});
