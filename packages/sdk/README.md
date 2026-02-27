# @promptos/sdk

Middleware wrapper for OpenAI and Anthropic clients with automatic caching, prompt compression, and token budget enforcement.

---

## Installation

```bash
bun add @promptos/sdk
```

Install the provider SDK you plan to use:

```bash
# For OpenAI
bun add openai

# For Anthropic
bun add @anthropic-ai/sdk
```

## Quick Start

```typescript
import { createClient } from '@promptos/sdk';

const client = await createClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  cache: { enabled: true },
});

const result = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

The wrapped client has the same API as the original SDK. Caching, compression, and budget enforcement happen transparently in the middleware pipeline.

## Features

| Feature | What it does | Config key |
|---------|-------------|------------|
| Cache | In-memory LRU cache with TTL. Identical requests return cached responses. | `cache` |
| Compression | Trims or sentence-splits messages to fit within a token budget. | `compression` |
| Token Budget | Enforces a max input token limit. Auto-compresses or throws if exceeded. | `tokenBudget` |

## Configuration

`createClient` accepts a `SdkClientConfig` object:

```typescript
interface SdkClientConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  baseURL?: string;
  cache?: CacheConfig;
  compression?: CompressionConfig;
  tokenBudget?: TokenBudgetConfig;
}
```

### Cache

```typescript
interface CacheConfig {
  enabled: boolean;
  ttlMs?: number;        // Time-to-live in ms (default: 300000 / 5 min)
  maxEntries?: number;   // Max cache entries before LRU eviction (default: 100)
}
```

Cache keys are computed from provider + model + messages + request parameters using SHA256.

### Compression

```typescript
interface CompressionConfig {
  enabled: boolean;
  strategy?: 'trim' | 'sentence' | 'none';  // default: 'trim'
}
```

| Strategy | Behavior |
|----------|----------|
| `trim` | Removes characters from the end of messages (skipping system messages) until under budget |
| `sentence` | Removes full sentences from the end of messages, respecting sentence boundaries |
| `none` | No-op |

Compression only activates when a `tokenBudget.maxInputTokens` is also configured.

### Token Budget

```typescript
interface TokenBudgetConfig {
  maxInputTokens?: number;
}
```

When input tokens exceed `maxInputTokens`:
- If compression is enabled, messages are compressed to fit
- If compression is disabled, a `TokenBudgetExceededError` is thrown

## Examples

### OpenAI with Cache + Compression + Budget

```typescript
import { createClient } from '@promptos/sdk';

const client = await createClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  cache: { enabled: true, ttlMs: 60000, maxEntries: 50 },
  compression: { enabled: true, strategy: 'sentence' },
  tokenBudget: { maxInputTokens: 4000 },
});

const result = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Summarize this document...' },
  ],
});
```

### Anthropic Client

```typescript
import { createClient } from '@promptos/sdk';

const client = await createClient({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const result = await client.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 1024,
  system: 'You are a helpful assistant.',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

The Anthropic adapter handles the `system` parameter conversion automatically. If `max_tokens` is omitted, it defaults to `4096`.

## Custom Middleware

Use `compose()` to build custom middleware pipelines:

```typescript
import {
  compose,
  createCacheMiddleware,
  createCompressionMiddleware,
  createBudgetMiddleware,
} from '@promptos/sdk';
import type { Middleware, MiddlewareContext, MiddlewareResult } from '@promptos/sdk';

// Custom logging middleware
const logger: Middleware = async (ctx, next) => {
  console.log(`Request: ${ctx.provider}/${ctx.model}`);
  const result = await next(ctx);
  console.log(`Cache hit: ${result.metadata.cacheHit}`);
  return result;
};

const pipeline = compose([
  logger,
  createCacheMiddleware({ enabled: true }),
  createBudgetMiddleware({ maxInputTokens: 4000 }, true, 'trim'),
  terminalMiddleware, // your provider call
]);
```

### Middleware Signature

```typescript
type Middleware = (ctx: MiddlewareContext, next: MiddlewareNext) => Promise<MiddlewareResult>;

interface MiddlewareContext {
  provider: 'openai' | 'anthropic';
  model: string;
  messages: NormalizedMessage[];
  originalRequest: Record<string, unknown>;
  metadata: MiddlewareMetadata;
}

interface MiddlewareResult {
  response: unknown;
  metadata: MiddlewareMetadata;
}

interface MiddlewareMetadata {
  cacheHit: boolean;
  compressed: boolean;
  originalTokenCount: number;
  finalTokenCount: number;
  budgetEnforced: boolean;
}
```

Middlewares execute in order. Each calls `next(ctx)` to continue the chain or returns early to short-circuit (e.g., cache hit).

## Errors

| Error | When | Properties |
|-------|------|------------|
| `PromptOSError` | Base error for all SDK errors | `message` |
| `ProviderNotInstalledError` | Provider SDK package is not installed | `message` with install instructions |
| `TokenBudgetExceededError` | Token count exceeds budget and compression is disabled | `tokenCount`, `maxTokens` |

```typescript
import { TokenBudgetExceededError } from '@promptos/sdk';

try {
  await client.chat.completions.create({ /* ... */ });
} catch (err) {
  if (err instanceof TokenBudgetExceededError) {
    console.log(`${err.tokenCount} tokens exceeds limit of ${err.maxTokens}`);
  }
}
```

## License

[MIT](../../LICENSE)
