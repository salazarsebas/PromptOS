import { describe, expect, it } from 'vitest';
import { denormalizeToAnthropic, normalizeAnthropicMessages } from './anthropic-normalizer.js';

describe('normalizeAnthropicMessages', () => {
  it('converts system param to system message', () => {
    const result = normalizeAnthropicMessages({
      system: 'You are helpful.',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(result).toEqual([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello' },
    ]);
  });

  it('handles messages without system param', () => {
    const result = normalizeAnthropicMessages({
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
    });
    expect(result).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]);
  });

  it('extracts text from content arrays', () => {
    const result = normalizeAnthropicMessages({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'First' },
            { type: 'text', text: 'Second' },
          ],
        },
      ],
    });
    expect(result).toEqual([{ role: 'user', content: 'First\nSecond' }]);
  });
});

describe('denormalizeToAnthropic', () => {
  it('extracts system message to top-level param', () => {
    const result = denormalizeToAnthropic([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Hello' },
    ]);
    expect(result.system).toBe('You are helpful.');
    expect(result.messages).toEqual([{ role: 'user', content: 'Hello' }]);
  });

  it('handles no system message', () => {
    const result = denormalizeToAnthropic([{ role: 'user', content: 'Hello' }]);
    expect(result.system).toBeUndefined();
    expect(result.messages).toEqual([{ role: 'user', content: 'Hello' }]);
  });

  it('round-trips correctly', () => {
    const original = {
      system: 'Be helpful.',
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
      ],
    };
    const normalized = normalizeAnthropicMessages(original);
    const denormalized = denormalizeToAnthropic(normalized);
    expect(denormalized.system).toBe(original.system);
    expect(denormalized.messages).toEqual(original.messages);
  });
});
