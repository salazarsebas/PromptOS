import { describe, expect, it, vi } from 'vitest';
import type { ProviderConfig, RouterProvider } from '../types.js';
import { ProviderExecutor } from './provider-executor.js';

function mockOpenAIClient() {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Hello from OpenAI' } }],
          model: 'gpt-4o',
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        }),
      },
    },
  };
}

function mockAnthropicClient() {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ text: 'Hello from Anthropic' }],
        model: 'claude-sonnet-4-5',
        usage: { input_tokens: 12, output_tokens: 8 },
      }),
    },
  };
}

describe('ProviderExecutor', () => {
  const openaiConfig: ProviderConfig = { apiKey: 'sk-test' };
  const anthropicConfig: ProviderConfig = { apiKey: 'sk-ant-test' };

  it('executes an OpenAI call and returns normalized result', async () => {
    const mockClient = mockOpenAIClient();
    const factory = vi.fn().mockReturnValue(mockClient);
    const executor = new ProviderExecutor(factory);

    const result = await executor.execute('openai', openaiConfig, {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.content).toBe('Hello from OpenAI');
    expect(result.model).toBe('gpt-4o');
    expect(result.provider).toBe('openai');
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 5 });
  });

  it('executes an Anthropic call and returns normalized result', async () => {
    const mockClient = mockAnthropicClient();
    const factory = vi.fn().mockReturnValue(mockClient);
    const executor = new ProviderExecutor(factory);

    const result = await executor.execute('anthropic', anthropicConfig, {
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.content).toBe('Hello from Anthropic');
    expect(result.model).toBe('claude-sonnet-4-5');
    expect(result.provider).toBe('anthropic');
    expect(result.usage).toEqual({ inputTokens: 12, outputTokens: 8 });
  });

  it('separates system prompt for Anthropic', async () => {
    const mockClient = mockAnthropicClient();
    const factory = vi.fn().mockReturnValue(mockClient);
    const executor = new ProviderExecutor(factory);

    await executor.execute('anthropic', anthropicConfig, {
      model: 'claude-sonnet-4-5',
      messages: [
        { role: 'system', content: 'Be helpful' },
        { role: 'user', content: 'Hi' },
      ],
    });

    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'Be helpful',
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    );
  });

  it('caches clients by provider:apiKey:baseURL', async () => {
    const factory = vi
      .fn()
      .mockImplementation((provider: RouterProvider) =>
        provider === 'openai' ? mockOpenAIClient() : mockAnthropicClient(),
      );
    const executor = new ProviderExecutor(factory);

    await executor.execute('openai', openaiConfig, {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
    });
    await executor.execute('openai', openaiConfig, {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    // Same provider + apiKey → factory called only once
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('creates separate clients for different configs', async () => {
    const factory = vi
      .fn()
      .mockImplementation((provider: RouterProvider) =>
        provider === 'openai' ? mockOpenAIClient() : mockAnthropicClient(),
      );
    const executor = new ProviderExecutor(factory);

    await executor.execute('openai', openaiConfig, {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
    });
    await executor.execute('anthropic', anthropicConfig, {
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('passes max_tokens and temperature to OpenAI', async () => {
    const mockClient = mockOpenAIClient();
    const factory = vi.fn().mockReturnValue(mockClient);
    const executor = new ProviderExecutor(factory);

    await executor.execute('openai', openaiConfig, {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
      maxTokens: 100,
      temperature: 0.5,
    });

    expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 100,
        temperature: 0.5,
      }),
    );
  });

  it('defaults Anthropic max_tokens to 4096', async () => {
    const mockClient = mockAnthropicClient();
    const factory = vi.fn().mockReturnValue(mockClient);
    const executor = new ProviderExecutor(factory);

    await executor.execute('anthropic', anthropicConfig, {
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 4096 }),
    );
  });

  it('handles empty OpenAI response gracefully', async () => {
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [],
            model: 'gpt-4o',
          }),
        },
      },
    };
    const factory = vi.fn().mockReturnValue(mockClient);
    const executor = new ProviderExecutor(factory);

    const result = await executor.execute('openai', openaiConfig, {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.content).toBe('');
    expect(result.usage).toBeUndefined();
  });
});
