import { ProviderNotInstalledError } from '../errors.js';

export async function loadOpenAIClient(options: { apiKey: string; baseURL?: string }): Promise<{
  chat: { completions: { create: (params: Record<string, unknown>) => Promise<unknown> } };
}> {
  let Constructor: new (opts: typeof options) => unknown;
  try {
    const mod = await import('openai');
    Constructor = mod.default ?? mod;
  } catch {
    throw new ProviderNotInstalledError('openai', 'openai');
  }
  return new Constructor(options) as Awaited<ReturnType<typeof loadOpenAIClient>>;
}

export async function loadAnthropicClient(options: { apiKey: string; baseURL?: string }): Promise<{
  messages: { create: (params: Record<string, unknown>) => Promise<unknown> };
}> {
  let Constructor: new (opts: typeof options) => unknown;
  try {
    const mod = await import('@anthropic-ai/sdk');
    Constructor = mod.default ?? mod;
  } catch {
    throw new ProviderNotInstalledError('anthropic', '@anthropic-ai/sdk');
  }
  return new Constructor(options) as Awaited<ReturnType<typeof loadAnthropicClient>>;
}
