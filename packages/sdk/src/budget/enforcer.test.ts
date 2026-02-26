import type { NormalizedMessage } from '@promptos/shared';
import { describe, expect, it } from 'vitest';
import { TokenBudgetExceededError } from '../errors.js';
import { enforceBudget } from './enforcer.js';

const shortMessages: NormalizedMessage[] = [{ role: 'user', content: 'Hello' }];

const longMessages: NormalizedMessage[] = [{ role: 'user', content: 'word '.repeat(500) }];

describe('enforceBudget', () => {
  it('passes through when under budget', () => {
    const result = enforceBudget(shortMessages, {
      budget: { maxInputTokens: 1000 },
      compressionEnabled: false,
      compressionStrategy: 'none',
    });
    expect(result.budgetEnforced).toBe(false);
    expect(result.compressed).toBe(false);
    expect(result.messages).toBe(shortMessages);
  });

  it('passes through when no maxInputTokens set', () => {
    const result = enforceBudget(longMessages, {
      budget: {},
      compressionEnabled: false,
      compressionStrategy: 'none',
    });
    expect(result.budgetEnforced).toBe(false);
    expect(result.messages).toBe(longMessages);
  });

  it('compresses when over budget and compression enabled', () => {
    const result = enforceBudget(longMessages, {
      budget: { maxInputTokens: 50 },
      compressionEnabled: true,
      compressionStrategy: 'trim',
    });
    expect(result.budgetEnforced).toBe(true);
    expect(result.compressed).toBe(true);
    expect(result.finalTokenCount).toBeLessThanOrEqual(50);
    expect(result.originalTokenCount).toBeGreaterThan(50);
  });

  it('throws TokenBudgetExceededError when over budget without compression', () => {
    expect(() =>
      enforceBudget(longMessages, {
        budget: { maxInputTokens: 50 },
        compressionEnabled: false,
        compressionStrategy: 'none',
      }),
    ).toThrow(TokenBudgetExceededError);
  });

  it('reports correct token counts', () => {
    const result = enforceBudget(shortMessages, {
      budget: { maxInputTokens: 1000 },
      compressionEnabled: false,
      compressionStrategy: 'none',
    });
    expect(result.originalTokenCount).toBeGreaterThan(0);
    expect(result.finalTokenCount).toBe(result.originalTokenCount);
  });
});
