import type { Provider } from './provider.js';

export type SdkProvider = Extract<Provider, 'openai' | 'anthropic'>;

export interface CacheConfig {
  enabled: boolean;
  ttlMs?: number;
  maxEntries?: number;
}

export type CompressionStrategy = 'trim' | 'sentence' | 'none';

export interface CompressionConfig {
  enabled: boolean;
  strategy?: CompressionStrategy;
}

export interface TokenBudgetConfig {
  maxInputTokens?: number;
}

export interface SdkClientConfig {
  provider: SdkProvider;
  apiKey: string;
  cache?: CacheConfig;
  compression?: CompressionConfig;
  tokenBudget?: TokenBudgetConfig;
  baseURL?: string;
}

export interface NormalizedMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MiddlewareMetadata {
  cacheHit: boolean;
  compressed: boolean;
  originalTokenCount: number;
  finalTokenCount: number;
  budgetEnforced: boolean;
}

export interface MiddlewareContext {
  provider: SdkProvider;
  model: string;
  messages: NormalizedMessage[];
  originalRequest: Record<string, unknown>;
  metadata: MiddlewareMetadata;
}

export interface MiddlewareResult {
  response: unknown;
  metadata: MiddlewareMetadata;
}

export type MiddlewareNext = (ctx: MiddlewareContext) => Promise<MiddlewareResult>;

export type Middleware = (
  ctx: MiddlewareContext,
  next: MiddlewareNext,
) => Promise<MiddlewareResult>;

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
