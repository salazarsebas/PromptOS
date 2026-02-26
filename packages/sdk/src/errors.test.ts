import { describe, expect, it } from 'vitest';
import { PromptOSError, ProviderNotInstalledError, TokenBudgetExceededError } from './errors.js';

describe('PromptOSError', () => {
  it('sets name and message', () => {
    const err = new PromptOSError('something went wrong');
    expect(err.name).toBe('PromptOSError');
    expect(err.message).toBe('something went wrong');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('ProviderNotInstalledError', () => {
  it('includes provider and package name in message', () => {
    const err = new ProviderNotInstalledError('openai', 'openai');
    expect(err.name).toBe('ProviderNotInstalledError');
    expect(err.message).toContain('openai');
    expect(err.message).toContain('bun add openai');
    expect(err).toBeInstanceOf(PromptOSError);
  });
});

describe('TokenBudgetExceededError', () => {
  it('includes token counts in message and properties', () => {
    const err = new TokenBudgetExceededError(5000, 4000);
    expect(err.name).toBe('TokenBudgetExceededError');
    expect(err.message).toContain('5000');
    expect(err.message).toContain('4000');
    expect(err.tokenCount).toBe(5000);
    expect(err.maxTokens).toBe(4000);
    expect(err).toBeInstanceOf(PromptOSError);
  });
});
