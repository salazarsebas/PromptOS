import type { AuditReport } from '@prompt-os/shared';
import { describe, expect, it } from 'vitest';
import { formatJson } from './json.js';

describe('formatJson', () => {
  it('returns valid JSON string', () => {
    const report: AuditReport = {
      version: '0.1.0',
      timestamp: '2026-01-01T00:00:00Z',
      targetPath: '/test',
      scan: {
        scannedFiles: 10,
        skippedFiles: 0,
        totalCalls: 0,
        calls: [],
        scanDurationMs: 100,
        errors: [],
      },
      cost: {
        totalMonthlyCostUSD: 0,
        byProvider: {},
        topCostDrivers: [],
        estimates: [],
      },
    };

    const output = formatJson(report);
    const parsed = JSON.parse(output);
    expect(parsed.version).toBe('0.1.0');
    expect(parsed.scan.scannedFiles).toBe(10);
  });

  it('preserves all report fields', () => {
    const report: AuditReport = {
      version: '0.1.0',
      timestamp: '2026-01-01T00:00:00Z',
      targetPath: '/test',
      scan: {
        scannedFiles: 1,
        skippedFiles: 0,
        totalCalls: 1,
        calls: [
          {
            filePath: 'test.ts',
            line: 1,
            column: 1,
            provider: 'openai',
            method: 'openai.chat.completions.create',
            category: 'chat',
            inferredModel: 'gpt-4o',
            contextSnippet: 'code here',
            confidence: 'high',
          },
        ],
        scanDurationMs: 50,
        errors: [],
      },
      cost: {
        totalMonthlyCostUSD: 3.25,
        byProvider: {
          openai: {
            provider: 'openai',
            totalMonthlyCostUSD: 3.25,
            callCount: 1,
            percentage: 100,
          },
        },
        topCostDrivers: [],
        estimates: [],
      },
    };

    const parsed = JSON.parse(formatJson(report));
    expect(parsed.scan.calls[0].provider).toBe('openai');
    expect(parsed.cost.totalMonthlyCostUSD).toBe(3.25);
  });
});
