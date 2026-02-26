import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { analyzeFile, analyzeFileDeep, releaseSourceFile } from './ast-analyzer.js';

const fixturesDir = join(import.meta.dirname, '..', '..', 'test', '__fixtures__');

describe('analyzeFile', () => {
  it('detects OpenAI calls in a TypeScript file', async () => {
    const results = await analyzeFile(join(fixturesDir, 'openai-usage.ts'));

    expect(results.length).toBe(3);

    const chatCalls = results.filter((r) => r.category === 'chat');
    const embeddingCalls = results.filter((r) => r.category === 'embedding');
    expect(chatCalls).toHaveLength(2);
    expect(embeddingCalls).toHaveLength(1);

    const gpt4oCall = results.find((r) => r.modelArgument === 'gpt-4o');
    expect(gpt4oCall).toBeDefined();
    expect(gpt4oCall?.provider).toBe('openai');
    expect(gpt4oCall?.confidence).toBe('high');
  });

  it('detects Anthropic calls', async () => {
    const results = await analyzeFile(join(fixturesDir, 'anthropic-usage.ts'));

    expect(results).toHaveLength(1);
    expect(results[0]?.provider).toBe('anthropic');
    expect(results[0]?.modelArgument).toBe('claude-sonnet-4-5');
    expect(results[0]?.category).toBe('chat');
  });

  it('detects Google calls', async () => {
    const results = await analyzeFile(join(fixturesDir, 'google-usage.ts'));

    expect(results).toHaveLength(1);
    expect(results[0]?.provider).toBe('google');
    expect(results[0]?.category).toBe('generation');
  });

  it('returns empty array for files with no LLM calls', async () => {
    const results = await analyzeFile(join(fixturesDir, 'no-llm-calls.ts'));
    expect(results).toEqual([]);
  });

  it('detects require-based imports in JS files', async () => {
    const results = await analyzeFile(join(fixturesDir, 'require-usage.js'));

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]?.provider).toBe('openai');
    expect(results[0]?.modelArgument).toBe('gpt-3.5-turbo');
  });

  it('includes file path and line numbers', async () => {
    const results = await analyzeFile(join(fixturesDir, 'openai-usage.ts'));

    for (const result of results) {
      expect(result.filePath).toContain('openai-usage.ts');
      expect(result.line).toBeGreaterThan(0);
      expect(result.column).toBeGreaterThan(0);
    }
  });

  it('includes context snippets', async () => {
    const results = await analyzeFile(join(fixturesDir, 'openai-usage.ts'));

    for (const result of results) {
      expect(result.contextSnippet).toBeTruthy();
      expect(result.contextSnippet.length).toBeGreaterThan(0);
    }
  });
});

describe('analyzeFileDeep', () => {
  it('retains sourceFile and releases cleanly', async () => {
    const result = await analyzeFileDeep(join(fixturesDir, 'openai-usage.ts'));

    expect(result.calls.length).toBeGreaterThan(0);
    expect(result.sourceFile).toBeDefined();
    expect(result.sourceFile.getFilePath()).toContain('openai-usage.ts');

    // Release should not throw
    releaseSourceFile(result.sourceFile);
  });
});
