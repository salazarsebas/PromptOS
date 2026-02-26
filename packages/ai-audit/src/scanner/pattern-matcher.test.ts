import type { CallExpression } from 'ts-morph';
import { Project, SyntaxKind } from 'ts-morph';
import { describe, expect, it } from 'vitest';
import { matchCallExpression } from './pattern-matcher.js';

function getFirstCallExpression(code: string): CallExpression {
  const project = new Project({
    compilerOptions: { allowJs: true },
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
  });
  const sourceFile = project.createSourceFile('test.ts', code, { overwrite: true });
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  const first = calls[0];
  if (!first) throw new Error('No call expression found in test code');
  return first;
}

describe('matchCallExpression', () => {
  it('detects openai.chat.completions.create with model', () => {
    const call = getFirstCallExpression(`
      openai.chat.completions.create({ model: 'gpt-4o', messages: [] });
    `);

    const match = matchCallExpression(call, ['openai']);
    expect(match).not.toBeNull();
    expect(match?.provider).toBe('openai');
    expect(match?.category).toBe('chat');
    expect(match?.modelArgument).toBe('gpt-4o');
    expect(match?.inferredModel).toBe('gpt-4o');
    expect(match?.confidence).toBe('high');
  });

  it('detects openai.embeddings.create', () => {
    const call = getFirstCallExpression(`
      openai.embeddings.create({ model: 'text-embedding-3-small', input: 'test' });
    `);

    const match = matchCallExpression(call, ['openai']);
    expect(match).not.toBeNull();
    expect(match?.provider).toBe('openai');
    expect(match?.category).toBe('embedding');
    expect(match?.modelArgument).toBe('text-embedding-3-small');
  });

  it('detects anthropic.messages.create', () => {
    const call = getFirstCallExpression(`
      anthropic.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 1024, messages: [] });
    `);

    const match = matchCallExpression(call, ['anthropic']);
    expect(match).not.toBeNull();
    expect(match?.provider).toBe('anthropic');
    expect(match?.category).toBe('chat');
    expect(match?.modelArgument).toBe('claude-sonnet-4-5');
  });

  it('detects google model.generateContent', () => {
    const call = getFirstCallExpression(`
      model.generateContent('Hello');
    `);

    const match = matchCallExpression(call, ['google']);
    expect(match).not.toBeNull();
    expect(match?.provider).toBe('google');
    expect(match?.category).toBe('generation');
  });

  it('returns null for non-LLM calls', () => {
    const call = getFirstCallExpression(`
      console.log('hello');
    `);

    const match = matchCallExpression(call, ['openai', 'anthropic']);
    expect(match).toBeNull();
  });

  it('returns null when provider not in active list', () => {
    const call = getFirstCallExpression(`
      openai.chat.completions.create({ model: 'gpt-4o', messages: [] });
    `);

    const match = matchCallExpression(call, ['anthropic']);
    expect(match).toBeNull();
  });

  it('uses medium confidence when model is not a string literal', () => {
    const call = getFirstCallExpression(`
      openai.chat.completions.create({ model: modelVar, messages: [] });
    `);

    const match = matchCallExpression(call, ['openai']);
    expect(match).not.toBeNull();
    expect(match?.confidence).toBe('medium');
    expect(match?.modelArgument).toBeUndefined();
    expect(match?.inferredModel).toBe('gpt-4o-mini'); // default
  });

  it('dots in patterns are escaped (B6)', () => {
    // "openai.chat.completions" should NOT match "openaiXchatYcompletions"
    const call = getFirstCallExpression(`
      openaiXchatYcompletions.create({ model: 'gpt-4o', messages: [] });
    `);
    const match = matchCallExpression(call, ['openai']);
    expect(match).toBeNull();
  });

  it('wildcards replace all occurrences (B6)', () => {
    // Pattern like "*.chat.completions" with a wildcard should still match any variable name
    const call = getFirstCallExpression(`
      myClient.chat.completions.create({ model: 'gpt-4o', messages: [] });
    `);
    const match = matchCallExpression(call, ['openai']);
    expect(match).not.toBeNull();
    expect(match?.provider).toBe('openai');
  });

  it('detects calls with different variable names', () => {
    const call = getFirstCallExpression(`
      client.chat.completions.create({ model: 'gpt-4o', messages: [] });
    `);

    const match = matchCallExpression(call, ['openai']);
    expect(match).not.toBeNull();
    expect(match?.provider).toBe('openai');
  });
});
