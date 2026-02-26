import { createHash } from 'node:crypto';
import type { CallResult } from '../fallback/fallback-executor.js';
import type { NormalizedMessage, ProviderConfig, RouterProvider } from '../types.js';

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

interface AnthropicResponse {
  content: Array<{ text: string }>;
  model: string;
  usage?: { input_tokens: number; output_tokens: number };
}

interface ExecuteParams {
  model: string;
  messages: NormalizedMessage[];
  maxTokens?: number;
  temperature?: number;
}

type ClientFactory = (
  provider: RouterProvider,
  config: ProviderConfig,
) => unknown | Promise<unknown>;

export class ProviderExecutor {
  private readonly clients = new Map<string, unknown>();
  private readonly clientFactory: ClientFactory;

  constructor(clientFactory?: ClientFactory) {
    this.clientFactory = clientFactory ?? defaultClientFactory;
  }

  async execute(
    provider: RouterProvider,
    config: ProviderConfig,
    params: ExecuteParams,
  ): Promise<CallResult> {
    const client = await this.getOrCreateClient(provider, config);

    if (provider === 'openai') {
      return this.executeOpenAI(client, provider, params);
    }
    return this.executeAnthropic(client, provider, params);
  }

  private async getOrCreateClient(
    provider: RouterProvider,
    config: ProviderConfig,
  ): Promise<unknown> {
    const keyHash = createHash('sha256').update(config.apiKey).digest('hex').slice(0, 16);
    const key = `${provider}:${keyHash}:${config.baseURL ?? ''}`;
    let client = this.clients.get(key);
    if (!client) {
      client = await this.clientFactory(provider, config);
      this.clients.set(key, client);
    }
    return client;
  }

  private async executeOpenAI(
    client: unknown,
    provider: RouterProvider,
    params: ExecuteParams,
  ): Promise<CallResult> {
    const openai = client as {
      chat: { completions: { create: (p: unknown) => Promise<unknown> } };
    };
    const requestParams: Record<string, unknown> = {
      model: params.model,
      messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (params.maxTokens !== undefined) requestParams.max_tokens = params.maxTokens;
    if (params.temperature !== undefined) requestParams.temperature = params.temperature;

    const response = (await openai.chat.completions.create(requestParams)) as OpenAIResponse;

    return {
      content: response.choices[0]?.message.content ?? '',
      model: response.model,
      provider,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          }
        : undefined,
    };
  }

  private async executeAnthropic(
    client: unknown,
    provider: RouterProvider,
    params: ExecuteParams,
  ): Promise<CallResult> {
    const anthropic = client as { messages: { create: (p: unknown) => Promise<unknown> } };

    // Separate system prompt for Anthropic API
    const systemMessages = params.messages.filter((m) => m.role === 'system');
    const nonSystemMessages = params.messages.filter((m) => m.role !== 'system');
    const systemText = systemMessages.map((m) => m.content).join('\n');

    const requestParams: Record<string, unknown> = {
      model: params.model,
      messages: nonSystemMessages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: params.maxTokens ?? 4096,
    };

    if (systemText) requestParams.system = systemText;
    if (params.temperature !== undefined) requestParams.temperature = params.temperature;

    const response = (await anthropic.messages.create(requestParams)) as AnthropicResponse;

    return {
      content: response.content[0]?.text ?? '',
      model: response.model,
      provider,
      usage: response.usage
        ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens }
        : undefined,
    };
  }
}

async function defaultClientFactory(
  provider: RouterProvider,
  config: ProviderConfig,
): Promise<unknown> {
  if (provider === 'openai') {
    try {
      const mod = (await import('openai')) as { default: new (opts: unknown) => unknown };
      return new mod.default({ apiKey: config.apiKey, baseURL: config.baseURL });
    } catch {
      throw new Error(
        'openai package is required for OpenAI provider. Install it: npm install openai',
      );
    }
  }

  try {
    const mod = (await import('@anthropic-ai/sdk')) as {
      default: new (opts: unknown) => unknown;
    };
    return new mod.default({ apiKey: config.apiKey, baseURL: config.baseURL });
  } catch {
    throw new Error(
      '@anthropic-ai/sdk package is required for Anthropic provider. Install it: npm install @anthropic-ai/sdk',
    );
  }
}
