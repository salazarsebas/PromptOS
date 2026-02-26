import type { ModelPricing } from '../types/cost.js';

export const MODEL_PRICING: ModelPricing[] = [
  // OpenAI
  {
    model: 'gpt-4o',
    provider: 'openai',
    inputPer1MTokens: 2.5,
    outputPer1MTokens: 10.0,
    category: 'chat',
  },
  {
    model: 'gpt-4o-mini',
    provider: 'openai',
    inputPer1MTokens: 0.15,
    outputPer1MTokens: 0.6,
    category: 'chat',
  },
  {
    model: 'gpt-4-turbo',
    provider: 'openai',
    inputPer1MTokens: 10.0,
    outputPer1MTokens: 30.0,
    category: 'chat',
  },
  {
    model: 'gpt-3.5-turbo',
    provider: 'openai',
    inputPer1MTokens: 0.5,
    outputPer1MTokens: 1.5,
    category: 'chat',
  },
  {
    model: 'o1',
    provider: 'openai',
    inputPer1MTokens: 15.0,
    outputPer1MTokens: 60.0,
    category: 'chat',
  },
  {
    model: 'o1-mini',
    provider: 'openai',
    inputPer1MTokens: 3.0,
    outputPer1MTokens: 12.0,
    category: 'chat',
  },
  {
    model: 'o3-mini',
    provider: 'openai',
    inputPer1MTokens: 1.1,
    outputPer1MTokens: 4.4,
    category: 'chat',
  },
  {
    model: 'text-embedding-3-small',
    provider: 'openai',
    inputPer1MTokens: 0.02,
    outputPer1MTokens: 0,
    category: 'embedding',
  },
  {
    model: 'text-embedding-3-large',
    provider: 'openai',
    inputPer1MTokens: 0.13,
    outputPer1MTokens: 0,
    category: 'embedding',
  },
  {
    model: 'text-embedding-ada-002',
    provider: 'openai',
    inputPer1MTokens: 0.1,
    outputPer1MTokens: 0,
    category: 'embedding',
  },

  // Anthropic
  {
    model: 'claude-opus-4-5',
    provider: 'anthropic',
    inputPer1MTokens: 15.0,
    outputPer1MTokens: 75.0,
    category: 'chat',
  },
  {
    model: 'claude-sonnet-4-5',
    provider: 'anthropic',
    inputPer1MTokens: 3.0,
    outputPer1MTokens: 15.0,
    category: 'chat',
  },
  {
    model: 'claude-haiku-4-5',
    provider: 'anthropic',
    inputPer1MTokens: 0.8,
    outputPer1MTokens: 4.0,
    category: 'chat',
  },
  {
    model: 'claude-3-opus',
    provider: 'anthropic',
    inputPer1MTokens: 15.0,
    outputPer1MTokens: 75.0,
    category: 'chat',
  },
  {
    model: 'claude-3-sonnet',
    provider: 'anthropic',
    inputPer1MTokens: 3.0,
    outputPer1MTokens: 15.0,
    category: 'chat',
  },
  {
    model: 'claude-3-haiku',
    provider: 'anthropic',
    inputPer1MTokens: 0.25,
    outputPer1MTokens: 1.25,
    category: 'chat',
  },

  // Google
  {
    model: 'gemini-2.5-pro',
    provider: 'google',
    inputPer1MTokens: 1.25,
    outputPer1MTokens: 10.0,
    category: 'chat',
  },
  {
    model: 'gemini-2.5-flash',
    provider: 'google',
    inputPer1MTokens: 0.15,
    outputPer1MTokens: 0.6,
    category: 'chat',
  },
  {
    model: 'gemini-2.0-flash',
    provider: 'google',
    inputPer1MTokens: 0.1,
    outputPer1MTokens: 0.4,
    category: 'chat',
  },
];

const PRICING_MAP = new Map<string, ModelPricing>(MODEL_PRICING.map((p) => [p.model, p]));

export function getPricing(model: string): ModelPricing | undefined {
  return PRICING_MAP.get(model);
}

export function getDefaultModel(provider: string, category: string): string {
  const defaults: Record<string, Record<string, string>> = {
    openai: { chat: 'gpt-4o-mini', embedding: 'text-embedding-3-small', completion: 'gpt-4o-mini' },
    anthropic: { chat: 'claude-sonnet-4-5', completion: 'claude-sonnet-4-5' },
    google: { chat: 'gemini-2.5-flash', generation: 'gemini-2.5-flash' },
    langchain: { chat: 'gpt-4o-mini' },
  };
  return defaults[provider]?.[category] ?? 'gpt-4o-mini';
}
