import { describe, expect, it } from 'vitest';
import { denormalizeToOpenAI, normalizeOpenAIMessages } from './openai-normalizer.js';

describe('normalizeOpenAIMessages', () => {
  it('normalizes simple string messages', () => {
    const result = normalizeOpenAIMessages([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello' },
    ]);
    expect(result).toEqual([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello' },
    ]);
  });

  it('extracts text from multi-content arrays', () => {
    const result = normalizeOpenAIMessages([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Part 1' },
          { type: 'text', text: 'Part 2' },
        ],
      },
    ]);
    expect(result).toEqual([{ role: 'user', content: 'Part 1\nPart 2' }]);
  });

  it('handles null content', () => {
    const result = normalizeOpenAIMessages([{ role: 'assistant', content: null }]);
    expect(result).toEqual([]);
  });

  it('maps unknown roles to user', () => {
    const result = normalizeOpenAIMessages([{ role: 'function', content: 'result' }]);
    expect(result[0]?.role).toBe('user');
  });
});

describe('denormalizeToOpenAI', () => {
  it('converts normalized messages back to OpenAI format', () => {
    const result = denormalizeToOpenAI([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello' },
    ]);
    expect(result).toEqual([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello' },
    ]);
  });
});
