# @promptos/router

Intelligent routing between LLM providers with fallback chains and health tracking.

---

The router classifies request complexity, selects the optimal model and provider based on your strategy, and automatically falls back to alternative providers on failure.

## Installation

```bash
bun add @promptos/router
```

Install the provider SDKs you plan to use:

```bash
# Install one or both
bun add openai
bun add @anthropic-ai/sdk
```

## Quick Start

```typescript
import { createRouter } from '@promptos/router';

const router = createRouter({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
  },
  routing: { strategy: 'balanced' },
});

const response = await router.complete({
  messages: [{ role: 'user', content: 'Explain microservices in one paragraph.' }],
});

console.log(response.content);
console.log(response.routing.complexity.level); // 'simple' | 'moderate' | 'complex'
console.log(response.routing.selectedModel);     // e.g. 'gpt-4o-mini'
```

## Routing Strategies

The router selects a model based on the request's classified complexity:

| Complexity | `cost-optimized` | `quality-first` | `balanced` |
|------------|-------------------|-----------------|------------|
| **simple** | gpt-4o-mini / claude-haiku-4-5 | gpt-4o / claude-sonnet-4-5 | gpt-4o-mini / claude-haiku-4-5 |
| **moderate** | gpt-4o-mini / claude-haiku-4-5 | gpt-4o / claude-sonnet-4-5 | gpt-4o / claude-sonnet-4-5 |
| **complex** | gpt-4o / claude-sonnet-4-5 | gpt-4o / claude-sonnet-4-5 | gpt-4o / claude-sonnet-4-5 |

## Configuration

```typescript
interface RouterConfig {
  providers: Partial<Record<'openai' | 'anthropic', ProviderConfig>>;
  routing: RoutingConfig;
  healthCheck?: HealthCheckConfig;
}

interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
}

interface RoutingConfig {
  strategy: 'cost-optimized' | 'quality-first' | 'balanced';
  fallbackChain?: ('openai' | 'anthropic')[];
}

interface HealthCheckConfig {
  windowSizeMs?: number;       // default: 60000 (60s)
  maxWindowEntries?: number;   // default: 100
  failureThreshold?: number;   // default: 0.5 (50%)
}
```

### Full Example

```typescript
const router = createRouter({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL,
    },
  },
  routing: {
    strategy: 'balanced',
    fallbackChain: ['openai', 'anthropic'],
  },
  healthCheck: {
    windowSizeMs: 60000,
    maxWindowEntries: 100,
    failureThreshold: 0.5,
  },
});
```

## Fallback Chain

When a provider fails, the router automatically tries the next provider in the chain:

1. Routes are tried in the configured `fallbackChain` order
2. Failed attempts use exponential backoff (500ms base, 5s max) with jitter
3. All attempt results are recorded in the response metadata
4. If all providers fail, an `AllProvidersFailedError` is thrown

```typescript
const router = createRouter({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
  },
  routing: {
    strategy: 'cost-optimized',
    fallbackChain: ['openai', 'anthropic'],
  },
});

const response = await router.complete({
  messages: [{ role: 'user', content: 'Hello' }],
});

// Inspect routing attempts
for (const attempt of response.routing.attempts) {
  console.log(`${attempt.provider}: ${attempt.success ? 'ok' : attempt.error} (${attempt.latencyMs}ms)`);
}
```

## Health Tracking

The router tracks provider health using a sliding time window:

- **Window size**: Configurable (default 60 seconds). Only recent requests are considered.
- **Failure threshold**: A provider is marked unhealthy when its failure rate exceeds the threshold (default 50%).
- **Max entries**: Caps the number of entries per provider within the window (default 100).
- **Auto-reset**: Old entries expire as the window slides forward.

Unhealthy providers are deprioritized in the fallback chain.

## Complexity Classification

The router classifies each request into `simple`, `moderate`, or `complex` using five weighted signals:

| Signal | Weight | Description |
|--------|--------|-------------|
| Token count | 35% | Total tokens across all messages (500-2000 range) |
| Keyword complexity | 30% | Ratio of complex keywords (analyze, compare, refactor, debug...) to simple ones (translate, list, classify...) |
| Multi-turn | 15% | More than 2 non-system messages |
| System prompt | 10% | Presence of a system message |
| Message count | 10% | Number of messages (capped at 10) |

Score ranges: `< 0.33` = simple, `0.33-0.66` = moderate, `>= 0.66` = complex.

## RouterResponse

```typescript
interface RouterResponse {
  content: string;
  model: string;
  provider: 'openai' | 'anthropic';
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  routing: {
    complexity: ComplexityResult;
    selectedModel: string;
    selectedProvider: 'openai' | 'anthropic';
    attempts: RoutingAttempt[];
    totalLatencyMs: number;
  };
}

interface RoutingAttempt {
  provider: 'openai' | 'anthropic';
  model: string;
  success: boolean;
  latencyMs: number;
  error?: string;
}

interface ComplexityResult {
  level: 'simple' | 'moderate' | 'complex';
  signals: ComplexitySignals;
  confidence: number;  // 0-1
}
```

## Errors

| Error | When |
|-------|------|
| `NoProvidersConfiguredError` | No providers passed to `createRouter` |
| `AllProvidersFailedError` | Every provider in the fallback chain failed |

```typescript
import { AllProvidersFailedError } from '@promptos/router';

try {
  await router.complete({ messages: [{ role: 'user', content: 'Hello' }] });
} catch (err) {
  if (err instanceof AllProvidersFailedError) {
    for (const attempt of err.routingAttempts) {
      console.log(`${attempt.provider}/${attempt.model}: ${attempt.error}`);
    }
  }
}
```

## License

[MIT](../../LICENSE)
