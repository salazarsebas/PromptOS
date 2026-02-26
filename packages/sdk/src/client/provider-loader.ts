import { ProviderNotInstalledError } from '../errors.js';

export function loadOpenAIClient(options: { apiKey: string; baseURL?: string }): {
  chat: { completions: { create: (params: Record<string, unknown>) => Promise<unknown> } };
} {
  let Constructor: new (opts: typeof options) => unknown;
  try {
    const mod = require('openai');
    Constructor = mod.default ?? mod;
  } catch {
    throw new ProviderNotInstalledError('openai', 'openai');
  }
  return new Constructor(options) as ReturnType<typeof loadOpenAIClient>;
}

export function loadAnthropicClient(options: { apiKey: string; baseURL?: string }): {
  messages: { create: (params: Record<string, unknown>) => Promise<unknown> };
} {
  let Constructor: new (opts: typeof options) => unknown;
  try {
    const mod = require('@anthropic-ai/sdk');
    Constructor = mod.default ?? mod;
  } catch {
    throw new ProviderNotInstalledError('anthropic', '@anthropic-ai/sdk');
  }
  return new Constructor(options) as ReturnType<typeof loadAnthropicClient>;
}
