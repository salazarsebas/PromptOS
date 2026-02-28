import type { AuditReport } from '@prompt-os/shared';
import { describe, expect, it } from 'vitest';
import { formatTerminal } from './terminal.js';

function makeReport(overrides: Partial<AuditReport> = {}): AuditReport {
  return {
    version: '0.1.0',
    timestamp: '2026-01-01T00:00:00Z',
    targetPath: '/test/project',
    scan: {
      scannedFiles: 100,
      skippedFiles: 0,
      totalCalls: 2,
      calls: [
        {
          filePath: 'src/ai.ts',
          line: 10,
          column: 1,
          provider: 'openai',
          method: 'openai.chat.completions.create',
          category: 'chat',
          modelArgument: 'gpt-4o',
          inferredModel: 'gpt-4o',
          contextSnippet: '',
          confidence: 'high',
        },
        {
          filePath: 'src/embed.ts',
          line: 5,
          column: 1,
          provider: 'openai',
          method: 'openai.embeddings.create',
          category: 'embedding',
          modelArgument: 'text-embedding-3-small',
          inferredModel: 'text-embedding-3-small',
          contextSnippet: '',
          confidence: 'high',
        },
      ],
      scanDurationMs: 1500,
      errors: [],
    },
    cost: {
      totalMonthlyCostUSD: 100.5,
      byProvider: {
        openai: {
          provider: 'openai',
          totalMonthlyCostUSD: 100.5,
          callCount: 2,
          percentage: 100,
        },
      },
      topCostDrivers: [
        {
          callIndex: 0,
          model: 'gpt-4o',
          estimatedInputTokensPerCall: 500,
          estimatedOutputTokensPerCall: 200,
          estimatedCallsPerMonth: 1000,
          monthlyCostUSD: 95.0,
        },
        {
          callIndex: 1,
          model: 'text-embedding-3-small',
          estimatedInputTokensPerCall: 500,
          estimatedOutputTokensPerCall: 200,
          estimatedCallsPerMonth: 1000,
          monthlyCostUSD: 5.5,
        },
      ],
      estimates: [],
    },
    ...overrides,
  };
}

describe('formatTerminal', () => {
  it('includes report header', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('PromptOS AI Audit Report');
    expect(output).toContain('100 files');
  });

  it('shows provider usage', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('Openai');
    expect(output).toContain('2 calls');
  });

  it('shows cost summary', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('$100.50');
    expect(output).toContain('100%');
  });

  it('shows top cost drivers', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('src/ai.ts:10');
    expect(output).toContain('$95.00/mo');
  });

  it('handles empty scan results', () => {
    const report = makeReport({
      scan: {
        scannedFiles: 50,
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
    });
    const output = formatTerminal(report);
    expect(output).toContain('No LLM API calls detected');
  });

  it('shows skipped files warning', () => {
    const report = makeReport();
    report.scan.skippedFiles = 3;
    const output = formatTerminal(report);
    expect(output).toContain('Skipped: 3 files');
  });
});
