import type { AuditReport } from '@prompt-os/shared';
import { describe, expect, it } from 'vitest';
import { formatHtml } from './html.js';

function makeReport(overrides?: Partial<AuditReport>): AuditReport {
  return {
    version: '0.1.0',
    timestamp: '2025-01-15T10:00:00.000Z',
    targetPath: '/test/project',
    scan: {
      scannedFiles: 10,
      skippedFiles: 0,
      totalCalls: 2,
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
      scanDurationMs: 800,
      errors: [],
    },
    cost: {
      totalMonthlyCostUSD: 12.5,
      byProvider: {
        openai: { provider: 'openai', totalMonthlyCostUSD: 5.0, callCount: 1, percentage: 40 },
        anthropic: {
          provider: 'anthropic',
          totalMonthlyCostUSD: 7.5,
          callCount: 1,
          percentage: 60,
        },
      },
      topCostDrivers: [
        {
          callIndex: 1,
          model: 'claude-sonnet-4-5',
          estimatedInputTokensPerCall: 500,
          estimatedOutputTokensPerCall: 200,
          estimatedCallsPerMonth: 1000,
          monthlyCostUSD: 7.5,
        },
      ],
      estimates: [],
    },
    ...overrides,
  };
}

describe('formatHtml', () => {
  it('produces valid HTML document', () => {
    const output = formatHtml(makeReport());

    expect(output).toContain('<!DOCTYPE html>');
    expect(output).toContain('<html lang="en">');
    expect(output).toContain('<style>');
    expect(output).toContain('</html>');
    expect(output).toContain('PromptOS AI Audit Report');
  });

  it('contains key report sections', () => {
    const output = formatHtml(makeReport());

    expect(output).toContain('Files Scanned');
    expect(output).toContain('API Calls Detected');
    expect(output).toContain('Estimated Monthly Cost');
    expect(output).toContain('$12.50');
    expect(output).toContain('Provider Usage');
    expect(output).toContain('Top Cost Drivers');
  });

  it('renders deep analysis section when present', () => {
    const output = formatHtml(
      makeReport({
        deepAnalysis: {
          opportunities: [
            {
              type: 'redundant-context',
              severity: 'high',
              filePath: 'src/api.ts',
              line: 15,
              description: 'Duplicated system prompt',
              suggestion: 'Extract into constant',
              estimatedMonthlySavingsUSD: 3.0,
            },
          ],
          totalEstimatedSavingsUSD: 3.0,
        },
      }),
    );

    expect(output).toContain('Optimization Opportunities');
    expect(output).toContain('severity-high');
    expect(output).toContain('redundant-context');
    expect(output).toContain('$3.00/mo');
  });

  it('escapes HTML in user content', () => {
    const output = formatHtml(
      makeReport({
        targetPath: '/path/<script>alert("xss")</script>',
      }),
    );

    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;script&gt;');
  });

  it('escapes single quotes in user content', () => {
    const output = formatHtml(
      makeReport({
        targetPath: "/path/it's-a-test",
      }),
    );

    expect(output).not.toContain("it's");
    expect(output).toContain('it&#x27;s');
  });
});
