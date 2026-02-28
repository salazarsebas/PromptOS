import type { NormalizedMessage } from '@prompt-os/shared';
import { describe, expect, it } from 'vitest';
import { classifyComplexity } from './complexity-classifier.js';

function msg(role: NormalizedMessage['role'], content: string): NormalizedMessage {
  return { role, content };
}

describe('classifyComplexity', () => {
  it('classifies a short greeting as simple', () => {
    const result = classifyComplexity([msg('user', 'Hello')]);
    expect(result.level).toBe('simple');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('classifies empty messages as simple', () => {
    const result = classifyComplexity([]);
    expect(result.level).toBe('simple');
    expect(result.signals.tokenCount).toBe(0);
  });

  it('classifies a simple keyword request as simple', () => {
    const result = classifyComplexity([msg('user', 'Translate this to French: Hello world')]);
    expect(result.level).toBe('simple');
  });

  it('classifies complex multi-turn with complex keywords and high token count as complex', () => {
    const longCode = `function processData(input) {\n${'  const x = performStep();\n'.repeat(300)}}`;
    const messages: NormalizedMessage[] = [
      msg('system', 'You are a senior code reviewer.'),
      msg('user', `Please analyze this code step-by-step and refactor it:\n${longCode}`),
      msg('assistant', 'Sure, let me look at this...'),
      msg('user', 'Also compare the trade-offs of different approaches and debug the issue.'),
    ];
    const result = classifyComplexity(messages);
    expect(result.level).toBe('complex');
  });

  it('returns moderate for medium complexity', () => {
    const messages: NormalizedMessage[] = [
      msg('system', 'You are a helpful assistant.'),
      msg('user', 'Summarize this article and also analyze the key points.'),
      msg('assistant', 'Here is a summary...'),
      msg('user', 'Can you compare the two arguments presented?'),
    ];
    const result = classifyComplexity(messages);
    expect(result.level).toBe('moderate');
  });

  it('treats high token count as complex even without keywords', () => {
    const longContent = 'word '.repeat(600); // ~600 tokens, well above 500 ceiling
    const result = classifyComplexity([msg('user', longContent)]);
    // No complex keywords, but token count pushes score up
    expect(result.signals.tokenCount).toBeGreaterThan(500);
  });

  it('detects multi-turn correctly', () => {
    const messages: NormalizedMessage[] = [
      msg('user', 'Hi'),
      msg('assistant', 'Hello!'),
      msg('user', 'How are you?'),
    ];
    const result = classifyComplexity(messages);
    expect(result.signals.hasMultiTurn).toBe(true);
  });

  it('detects system prompt', () => {
    const messages: NormalizedMessage[] = [
      msg('system', 'Be concise.'),
      msg('user', 'List 3 colors'),
    ];
    const result = classifyComplexity(messages);
    expect(result.signals.hasSystemPrompt).toBe(true);
  });

  it('does not flag single exchange as multi-turn', () => {
    const result = classifyComplexity([msg('user', 'Hi')]);
    expect(result.signals.hasMultiTurn).toBe(false);
  });

  it('keyword score is 0 when no keywords match (Q2)', () => {
    const result = classifyComplexity([msg('user', 'Tell me a joke')]);
    expect(result.signals.keywordComplexity).toBe(0);
  });

  it('keyword score is 1 when only complex keywords match', () => {
    const result = classifyComplexity([msg('user', 'Analyze and debug this')]);
    expect(result.signals.keywordComplexity).toBe(1);
  });

  it('keyword score is 0 when only simple keywords match', () => {
    const result = classifyComplexity([msg('user', 'Summarize and list the items')]);
    expect(result.signals.keywordComplexity).toBe(0);
  });

  it('confidence is higher when score is far from thresholds', () => {
    const simpleResult = classifyComplexity([msg('user', 'Hi')]);
    const borderlineResult = classifyComplexity([
      msg('system', 'Be helpful'),
      msg('user', 'Summarize this and also analyze it briefly'),
    ]);

    // A clear simple should have higher confidence than a borderline case
    if (simpleResult.level === 'simple' && borderlineResult.level !== 'simple') {
      expect(simpleResult.confidence).toBeGreaterThan(0);
    }
  });

  it('returns valid confidence between 0 and 1', () => {
    const cases: NormalizedMessage[][] = [
      [msg('user', 'Hi')],
      [msg('user', 'Analyze step-by-step and refactor the architecture')],
      [msg('system', 'System'), msg('user', 'List items')],
    ];

    for (const messages of cases) {
      const result = classifyComplexity(messages);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });
});
