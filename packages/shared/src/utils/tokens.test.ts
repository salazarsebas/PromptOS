import { describe, expect, it } from 'vitest';
import { estimateTokens, estimateTokensFast } from './tokens.js';

describe('estimateTokens', () => {
  it('returns a positive count for normal text', () => {
    expect(estimateTokens('Hello world')).toBeGreaterThan(0);
  });

  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('handles unicode and emoji', () => {
    const count = estimateTokens('Hello 🌍 world 你好');
    expect(count).toBeGreaterThan(0);
  });

  it('handles long text', () => {
    const longText = 'word '.repeat(5000);
    const count = estimateTokens(longText);
    expect(count).toBeGreaterThan(1000);
  });

  it('handles single character', () => {
    expect(estimateTokens('a')).toBeGreaterThan(0);
  });
});

describe('estimateTokensFast', () => {
  it('estimates tokens as charCount / 4', () => {
    expect(estimateTokensFast(100)).toBe(25);
  });

  it('rounds up for non-divisible counts', () => {
    expect(estimateTokensFast(5)).toBe(2);
  });

  it('returns 0 for 0 chars', () => {
    expect(estimateTokensFast(0)).toBe(0);
  });
});
