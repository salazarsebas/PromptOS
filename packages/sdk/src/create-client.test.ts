import { describe, expect, it, vi } from 'vitest';
import { PromptOSError } from './errors.js';

vi.mock('./client/provider-loader.js', () => ({
  loadOpenAIClient: vi.fn(async () => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          id: 'chatcmpl-test',
          choices: [{ message: { role: 'assistant', content: 'OpenAI response' } }],
        }),
      },
    },
  })),
  loadAnthropicClient: vi.fn(async () => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        id: 'msg-test',
        content: [{ type: 'text', text: 'Anthropic response' }],
        role: 'assistant',
      }),
    },
  })),
}));

import { createClient } from './create-client.js';

describe('createClient', () => {
  it('creates an OpenAI client that returns responses', async () => {
    const client = (await createClient({
      provider: 'openai',
      apiKey: 'test-key',
    })) as { chat: { completions: { create: (p: unknown) => Promise<unknown> } } };

    const result = (await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
    })) as { choices: unknown[] };

    expect(result).toHaveProperty('choices');
  });

  it('creates an Anthropic client that returns responses', async () => {
    const client = (await createClient({
      provider: 'anthropic',
      apiKey: 'test-key',
    })) as { messages: { create: (p: unknown) => Promise<unknown> } };

    const result = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result).toHaveProperty('content');
  });

  it('uses cache when enabled', async () => {
    const client = (await createClient({
      provider: 'openai',
      apiKey: 'test-key',
      cache: { enabled: true, ttlMs: 5000 },
    })) as { chat: { completions: { create: (p: unknown) => Promise<unknown> } } };

    const params = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
    };

    const result1 = await client.chat.completions.create(params);
    const result2 = await client.chat.completions.create(params);

    expect(result1).toHaveProperty('choices');
    expect(result2).toHaveProperty('choices');
  });

  it('creates client with compression and budget', async () => {
    const client = (await createClient({
      provider: 'openai',
      apiKey: 'test-key',
      compression: { enabled: true, strategy: 'trim' },
      tokenBudget: { maxInputTokens: 4000 },
    })) as { chat: { completions: { create: (p: unknown) => Promise<unknown> } } };

    const result = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result).toHaveProperty('choices');
  });

  it('throws for unsupported provider', async () => {
    await expect(
      createClient({
        provider: 'google' as 'openai',
        apiKey: 'test-key',
      }),
    ).rejects.toThrow(PromptOSError);
  });
});
