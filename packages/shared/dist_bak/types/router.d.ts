import type { ModelIdentifier, Provider } from './provider.js';
import type { NormalizedMessage } from './sdk.js';
export type ComplexityLevel = 'simple' | 'moderate' | 'complex';
export interface ComplexitySignals {
  tokenCount: number;
  messageCount: number;
  hasSystemPrompt: boolean;
  hasMultiTurn: boolean;
  keywordComplexity: number;
}
export interface ComplexityResult {
  level: ComplexityLevel;
  signals: ComplexitySignals;
  confidence: number;
}
export type RoutingStrategy = 'cost-optimized' | 'quality-first' | 'balanced';
export type RouterProvider = Extract<Provider, 'openai' | 'anthropic'>;
export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
}
export interface RoutingConfig {
  strategy: RoutingStrategy;
  fallbackChain?: RouterProvider[];
}
export interface HealthCheckConfig {
  windowSizeMs?: number;
  maxWindowEntries?: number;
  failureThreshold?: number;
}
export interface RouterConfig {
  providers: Partial<Record<RouterProvider, ProviderConfig>>;
  routing: RoutingConfig;
  healthCheck?: HealthCheckConfig;
}
export interface RouterRequest {
  messages: NormalizedMessage[];
  model?: ModelIdentifier;
  provider?: RouterProvider;
  maxTokens?: number;
  temperature?: number;
}
export interface RoutingAttempt {
  provider: RouterProvider;
  model: string;
  success: boolean;
  latencyMs: number;
  error?: string;
}
export interface RouterResponse {
  content: string;
  model: string;
  provider: RouterProvider;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  routing: {
    complexity: ComplexityResult;
    selectedModel: string;
    selectedProvider: RouterProvider;
    attempts: RoutingAttempt[];
    totalLatencyMs: number;
  };
}
export interface HealthStatus {
  provider: RouterProvider;
  healthy: boolean;
  successRate: number;
  totalRequests: number;
  windowStart: number;
}
//# sourceMappingURL=router.d.ts.map
