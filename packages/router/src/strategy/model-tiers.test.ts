import { describe, expect, it } from 'vitest';
import type { ComplexityLevel, RouterProvider, RoutingStrategy } from '../types.js';
import { getModelForTier } from './model-tiers.js';

describe('getModelForTier', () => {
  const strategies: RoutingStrategy[] = ['cost-optimized', 'quality-first', 'balanced'];
  const providers: RouterProvider[] = ['openai', 'anthropic'];
  const levels: ComplexityLevel[] = ['simple', 'moderate', 'complex'];

  it.each(
    strategies.flatMap((strategy) =>
      providers.flatMap((provider) => levels.map((level) => ({ strategy, provider, level }))),
    ),
  )('returns a model for $strategy / $provider / $level', ({ strategy, provider, level }) => {
    const model = getModelForTier(strategy, provider, level);
    expect(typeof model).toBe('string');
    expect(model.length).toBeGreaterThan(0);
  });

  // cost-optimized: cheap models for simple/moderate, expensive for complex
  it('cost-optimized uses gpt-4o-mini for simple OpenAI', () => {
    expect(getModelForTier('cost-optimized', 'openai', 'simple')).toBe('gpt-4o-mini');
  });

  it('cost-optimized uses gpt-4o for complex OpenAI', () => {
    expect(getModelForTier('cost-optimized', 'openai', 'complex')).toBe('gpt-4o');
  });

  it('cost-optimized uses claude-haiku for simple Anthropic', () => {
    expect(getModelForTier('cost-optimized', 'anthropic', 'simple')).toBe('claude-haiku-4-5');
  });

  it('cost-optimized uses claude-sonnet for complex Anthropic', () => {
    expect(getModelForTier('cost-optimized', 'anthropic', 'complex')).toBe('claude-sonnet-4-5');
  });

  // quality-first: always uses best model
  it('quality-first always uses gpt-4o for OpenAI', () => {
    for (const level of levels) {
      expect(getModelForTier('quality-first', 'openai', level)).toBe('gpt-4o');
    }
  });

  it('quality-first always uses claude-sonnet for Anthropic', () => {
    for (const level of levels) {
      expect(getModelForTier('quality-first', 'anthropic', level)).toBe('claude-sonnet-4-5');
    }
  });

  // balanced: cheap for simple, expensive for moderate+complex
  it('balanced uses gpt-4o-mini for simple OpenAI', () => {
    expect(getModelForTier('balanced', 'openai', 'simple')).toBe('gpt-4o-mini');
  });

  it('balanced uses gpt-4o for moderate OpenAI', () => {
    expect(getModelForTier('balanced', 'openai', 'moderate')).toBe('gpt-4o');
  });

  it('balanced uses claude-haiku for simple Anthropic', () => {
    expect(getModelForTier('balanced', 'anthropic', 'simple')).toBe('claude-haiku-4-5');
  });

  it('balanced uses claude-sonnet for moderate Anthropic', () => {
    expect(getModelForTier('balanced', 'anthropic', 'moderate')).toBe('claude-sonnet-4-5');
  });
});
