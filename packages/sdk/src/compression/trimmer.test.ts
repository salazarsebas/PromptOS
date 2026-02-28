import type { NormalizedMessage } from '@prompt-os/shared';
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

  it('handles emoji without producing invalid text (surrogate pairs)', () => {
    const emojiContent = '🌍🌎🌏 '.repeat(200);
    const messages: NormalizedMessage[] = [{ role: 'user', content: emojiContent }];
    const result = compressMessages(messages, 20, 'trim');
    // Should not contain lone surrogates — every char should be valid
    for (const char of result[0]?.content ?? '') {
      const code = char.codePointAt(0) ?? 0;
      // Lone surrogates are in range 0xD800-0xDFFF
      expect(code < 0xd800 || code > 0xdfff).toBe(true);
    }
  });

  it('sentence strategy handles abbreviations like Mr. Smith', () => {
    const messages: NormalizedMessage[] = [
      {
        role: 'user',
        content:
          'Mr. Smith went to Washington. He met Dr. Jones at the capitol. They discussed the budget.',
      },
    ];
    const maxTokens = 15;
    const result = compressMessages(messages, maxTokens, 'sentence');
    // "Mr. Smith" should NOT be treated as a sentence boundary
    const content = result[0]?.content ?? '';
    expect(content).not.toBe('Mr. ');
    expect(content).not.toMatch(/^Mr\.\s*$/);
  });
});
