import type { DetectedCall } from '@promptos/shared';
import { describe, expect, it } from 'vitest';
import { calculateCosts } from './cost-calculator.js';

function makeCall(overrides: Partial<DetectedCall> = {}): DetectedCall {
  return {
    filePath: 'test.ts',
    line: 1,
    column: 1,
    provider: 'openai',
    method: 'openai.chat.completions.create',
    category: 'chat',
    inferredModel: 'gpt-4o',
    contextSnippet: '',
    confidence: 'high',
    ...overrides,
  };
}

const defaultOptions = {
  callsPerMonth: 1000,
  avgInputTokens: 500,
  avgOutputTokens: 200,
};

describe('calculateCosts', () => {
  it('calculates cost for a single OpenAI gpt-4o call', () => {
    const calls = [makeCall({ inferredModel: 'gpt-4o' })];
    const report = calculateCosts(calls, defaultOptions);

    // gpt-4o: input $2.50/1M, output $10.00/1M
    // Per call: (500/1M * 2.50) + (200/1M * 10.00) = 0.00125 + 0.002 = 0.00325
    // Monthly: 0.00325 * 1000 = 3.25
    expect(report.totalMonthlyCostUSD).toBe(3.25);
    expect(report.estimates).toHaveLength(1);
    expect(report.estimates[0]?.monthlyCostUSD).toBe(3.25);
  });

  it('aggregates costs by provider', () => {
    const calls = [
      makeCall({ provider: 'openai', inferredModel: 'gpt-4o' }),
      makeCall({ provider: 'openai', inferredModel: 'gpt-4o-mini' }),
      makeCall({
        provider: 'anthropic',
        inferredModel: 'claude-sonnet-4-5',
        method: 'anthropic.messages.create',
      }),
    ];
    const report = calculateCosts(calls, defaultOptions);

    expect(Object.keys(report.byProvider)).toHaveLength(2);
    expect(report.byProvider.openai?.callCount).toBe(2);
    expect(report.byProvider.anthropic?.callCount).toBe(1);
  });

  it('calculates percentages correctly', () => {
    const calls = [
      makeCall({ provider: 'openai', inferredModel: 'gpt-4o' }),
      makeCall({ provider: 'anthropic', inferredModel: 'claude-sonnet-4-5' }),
    ];
    const report = calculateCosts(calls, defaultOptions);

    const totalPercentage =
      (report.byProvider.openai?.percentage ?? 0) + (report.byProvider.anthropic?.percentage ?? 0);
    expect(totalPercentage).toBe(100);
  });

  it('sorts top cost drivers by monthly cost descending', () => {
    const calls = [
      makeCall({ inferredModel: 'gpt-4o-mini' }), // cheap
      makeCall({ inferredModel: 'gpt-4o' }), // expensive
      makeCall({ inferredModel: 'gpt-4-turbo' }), // most expensive
    ];
    const report = calculateCosts(calls, defaultOptions);

    expect(report.topCostDrivers[0]?.monthlyCostUSD).toBeGreaterThan(
      report.topCostDrivers[1]?.monthlyCostUSD ?? 0,
    );
  });

  it('falls back to default model pricing for unknown models', () => {
    const calls = [makeCall({ provider: 'unknown', inferredModel: 'custom-model-v1' })];
    const report = calculateCosts(calls, defaultOptions);

    // Unknown model falls back to gpt-4o-mini via getDefaultModel
    // gpt-4o-mini: input $0.15/1M, output $0.60/1M
    // Per call: (500/1M * 0.15) + (200/1M * 0.60) = 0.000075 + 0.00012 = 0.000195
    // Monthly: 0.000195 * 1000 = 0.195 -> rounded to 0.20
    expect(report.totalMonthlyCostUSD).toBe(0.2);
  });

  it('handles empty calls array', () => {
    const report = calculateCosts([], defaultOptions);

    expect(report.totalMonthlyCostUSD).toBe(0);
    expect(report.estimates).toEqual([]);
    expect(report.topCostDrivers).toEqual([]);
  });

  it('handles embedding models with zero output cost', () => {
    const calls = [
      makeCall({
        category: 'embedding',
        inferredModel: 'text-embedding-3-small',
        method: 'openai.embeddings.create',
      }),
    ];
    const report = calculateCosts(calls, defaultOptions);

    // text-embedding-3-small: input $0.02/1M, output $0/1M
    // Per call: (500/1M * 0.02) + (200/1M * 0) = 0.00001
    // Monthly: 0.00001 * 1000 = 0.01
    expect(report.totalMonthlyCostUSD).toBe(0.01);
  });
});
