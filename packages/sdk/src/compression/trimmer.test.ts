import type { NormalizedMessage } from '@promptos/shared';
import { describe, expect, it } from 'vitest';
import { compressMessages, countTokens } from './trimmer.js';

describe('countTokens', () => {
  it('counts tokens across all messages', () => {
    const messages: NormalizedMessage[] = [
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello world' },
    ];
    const count = countTokens(messages);
    expect(count).toBeGreaterThan(0);
  });

  it('handles empty messages', () => {
    expect(countTokens([])).toBe(0);
  });
});

describe('compressMessages', () => {
  it('returns messages unchanged when under budget', () => {
    const messages: NormalizedMessage[] = [{ role: 'user', content: 'Hello' }];
    const result = compressMessages(messages, 1000, 'trim');
    expect(result[0]?.content).toBe('Hello');
  });

  it('returns messages unchanged with strategy none', () => {
    const longContent = 'word '.repeat(2000);
    const messages: NormalizedMessage[] = [{ role: 'user', content: longContent }];
    const result = compressMessages(messages, 10, 'none');
    expect(result[0]?.content).toBe(longContent);
  });

  it('trims content to fit budget with trim strategy', () => {
    const longContent = 'word '.repeat(500);
    const messages: NormalizedMessage[] = [{ role: 'user', content: longContent }];
    const maxTokens = 50;
    const result = compressMessages(messages, maxTokens, 'trim');
    const resultTokens = countTokens(result);
    expect(resultTokens).toBeLessThanOrEqual(maxTokens);
    expect(result[0]?.content.length).toBeLessThan(longContent.length);
  });

  it('does not trim system messages', () => {
    const systemContent = 'You are a helpful assistant. '.repeat(100);
    const messages: NormalizedMessage[] = [
      { role: 'system', content: systemContent },
      { role: 'user', content: 'short' },
    ];
    const result = compressMessages(messages, 50, 'trim');
    expect(result[0]?.content).toBe(systemContent);
  });

  it('compresses by sentence boundaries', () => {
    const messages: NormalizedMessage[] = [
      {
        role: 'user',
        content:
          'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.',
      },
    ];
    const maxTokens = 10;
    const result = compressMessages(messages, maxTokens, 'sentence');
    expect(result[0]?.content.length).toBeLessThan(messages[0]?.content.length ?? 0);
    // Should end at a sentence boundary
    expect(result[0]?.content).toMatch(/\.\s*$/);
  });

  it('returns empty array for empty input', () => {
    const result = compressMessages([], 100, 'trim');
    expect(result).toEqual([]);
  });

  it('does not mutate original messages', () => {
    const original: NormalizedMessage[] = [{ role: 'user', content: 'word '.repeat(500) }];
    const originalContent = original[0]?.content;
    compressMessages(original, 10, 'trim');
    expect(original[0]?.content).toBe(originalContent);
  });
});
