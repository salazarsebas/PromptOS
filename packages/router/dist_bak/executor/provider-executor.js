import { createHash } from 'node:crypto';

const HASH_PREFIX_LENGTH = 16;
const DEFAULT_MAX_TOKENS = 4096;
export class ProviderExecutor {
  clients = new Map();
  clientFactory;
  constructor(clientFactory) {
    this.clientFactory = clientFactory ?? defaultClientFactory;
  }
  async execute(provider, config, params) {
    const client = await this.getOrCreateClient(provider, config);
    if (provider === 'openai') {
      return this.executeOpenAI(client, provider, params);
    }
    return this.executeAnthropic(client, provider, params);
  }
  async getOrCreateClient(provider, config) {
    const keyHash = createHash('sha256')
      .update(config.apiKey)
      .digest('hex')
      .slice(0, HASH_PREFIX_LENGTH);
    const key = `${provider}:${keyHash}:${config.baseURL ?? ''}`;
    let client = this.clients.get(key);
    if (!client) {
      client = await this.clientFactory(provider, config);
      this.clients.set(key, client);
    }
    return client;
  }
  async executeOpenAI(client, provider, params) {
    const openai = client;
    const requestParams = {
      model: params.model,
      messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (params.maxTokens !== undefined) requestParams.max_tokens = params.maxTokens;
    if (params.temperature !== undefined) requestParams.temperature = params.temperature;
    const response = await openai.chat.completions.create(requestParams);
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
  async executeAnthropic(client, provider, params) {
    const anthropic = client;
    // Separate system prompt for Anthropic API
    const systemMessages = params.messages.filter((m) => m.role === 'system');
    const nonSystemMessages = params.messages.filter((m) => m.role !== 'system');
    const systemText = systemMessages.map((m) => m.content).join('\n');
    const requestParams = {
      model: params.model,
      messages: nonSystemMessages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
    };
    if (systemText) requestParams.system = systemText;
    if (params.temperature !== undefined) requestParams.temperature = params.temperature;
    const response = await anthropic.messages.create(requestParams);
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
async function defaultClientFactory(provider, config) {
  if (provider === 'openai') {
    try {
      const mod = await import('openai');
      return new mod.default({ apiKey: config.apiKey, baseURL: config.baseURL });
    } catch {
      throw new Error(
        'openai package is required for OpenAI provider. Install it: npm install openai',
      );
    }
  }
  try {
    const mod = await import('@anthropic-ai/sdk');
    return new mod.default({ apiKey: config.apiKey, baseURL: config.baseURL });
  } catch {
    throw new Error(
      '@anthropic-ai/sdk package is required for Anthropic provider. Install it: npm install @anthropic-ai/sdk',
    );
  }
}
//# sourceMappingURL=provider-executor.js.map
