import { describe, expect, it } from 'vitest';
import { getDefaultModel, getPricing, MODEL_PRICING } from './pricing.js';

describe('MODEL_PRICING', () => {
  it('contains pricing for major models', () => {
    expect(MODEL_PRICING.length).toBeGreaterThan(10);
  });

  it('has valid pricing values for all entries', () => {
    for (const entry of MODEL_PRICING) {
      expect(entry.model).toBeTruthy();
      expect(entry.provider).toBeTruthy();
      expect(entry.inputPer1MTokens).toBeGreaterThanOrEqual(0);
      expect(entry.outputPer1MTokens).toBeGreaterThanOrEqual(0);
      expect(entry.category).toBeTruthy();
    }
  });
});

describe('getPricing', () => {
  it('returns pricing for known models', () => {
    const pricing = getPricing('gpt-4o');
    expect(pricing).toBeDefined();
    expect(pricing?.provider).toBe('openai');
    expect(pricing?.inputPer1MTokens).toBe(2.5);
  });

  it('returns undefined for unknown models', () => {
    expect(getPricing('nonexistent-model')).toBeUndefined();
  });

  it('returns pricing for anthropic models', () => {
    const pricing = getPricing('claude-sonnet-4-5');
    expect(pricing).toBeDefined();
    expect(pricing?.provider).toBe('anthropic');
  });

  it('returns pricing for google models', () => {
    const pricing = getPricing('gemini-2.5-flash');
    expect(pricing).toBeDefined();
    expect(pricing?.provider).toBe('google');
  });
});

describe('getDefaultModel', () => {
  it('returns default chat model for openai', () => {
    expect(getDefaultModel('openai', 'chat')).toBe('gpt-4o-mini');
  });

  it('returns default embedding model for openai', () => {
    expect(getDefaultModel('openai', 'embedding')).toBe('text-embedding-3-small');
  });

  it('returns default model for anthropic', () => {
    expect(getDefaultModel('anthropic', 'chat')).toBe('claude-sonnet-4-5');
  });

  it('returns fallback for unknown provider', () => {
    expect(getDefaultModel('unknown', 'chat')).toBe('gpt-4o-mini');
  });
});
