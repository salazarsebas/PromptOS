import type { NormalizedMessage } from '@promptos/shared';
import { describe, expect, it } from 'vitest';
import { computeCacheKey } from './cache-key.js';

describe('computeCacheKey', () => {
  const messages: NormalizedMessage[] = [{ role: 'user', content: 'Hello' }];

  it('returns a hex string', () => {
    const key = computeCacheKey('openai', 'gpt-4o', messages);
    expect(key).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns the same key for identical input', () => {
    const a = computeCacheKey('openai', 'gpt-4o', messages);
    const b = computeCacheKey('openai', 'gpt-4o', messages);
    expect(a).toBe(b);
  });

  it('returns different keys for different models', () => {
    const a = computeCacheKey('openai', 'gpt-4o', messages);
    const b = computeCacheKey('openai', 'gpt-4o-mini', messages);
    expect(a).not.toBe(b);
  });

  it('returns different keys for different providers', () => {
    const a = computeCacheKey('openai', 'gpt-4o', messages);
    const b = computeCacheKey('anthropic', 'gpt-4o', messages);
    expect(a).not.toBe(b);
  });

  it('returns different keys for different messages', () => {
    const a = computeCacheKey('openai', 'gpt-4o', messages);
    const b = computeCacheKey('openai', 'gpt-4o', [{ role: 'user', content: 'Goodbye' }]);
    expect(a).not.toBe(b);
  });
});
