# PromptOS Usage Guide

A step-by-step guide to auditing, optimizing, and routing your LLM usage with PromptOS.

---

## Overview

PromptOS follows a three-phase workflow:

```
1. Audit       →  2. Optimize       →  3. Route
Find LLM calls    Add caching,         Route between
and estimate       compression,         providers with
monthly costs      and budgets          fallback
```

Each phase builds on the previous one. You can adopt them incrementally -- start with the audit to understand your spend, then add the SDK to reduce it, and finally the router to maximize reliability and cost efficiency.

---

## Phase 1: Audit Your LLM Spend

### Install the CLI

```bash
bun add -g @prompt-os/ai-audit
```

### Run a basic scan

Point `ai-audit` at your project directory:

```bash
ai-audit ./your-project
```

This scans all TypeScript/JavaScript/Python files, detects LLM API calls via AST analysis, and prints a cost estimate:

```
PromptOS AI Audit Report
========================
Scanned: 42 files (0.8s)

Provider Usage:
  Openai        3 calls  (chat: 2, embedding: 1)
  Anthropic     1 calls  (chat: 1)

Estimated Monthly Cost: $105.50
  Openai:       $55.50 (53%)
  Anthropic:    $50.00 (47%)

Top Cost Drivers:
  1. src/ai.ts:10          openai.chat.completions.create   ~$45.00/mo
  2. src/chat.ts:20        anthropic.messages.create         ~$50.00/mo
  3. src/embed.ts:5        openai.embeddings.create          ~$5.50/mo
```

### Find optimization opportunities

Add the `--deep` flag to detect wasteful patterns:

```bash
ai-audit ./your-project --deep
```

Deep analysis detects four types of issues:

| Issue | What it finds | Estimated savings |
|-------|--------------|-------------------|
| **model-downgrade** | Expensive models used for short/simple prompts | Based on price difference |
| **redundant-context** | Same system prompt duplicated across call sites | ~30% of input cost |
| **missing-cache** | LLM calls inside loops (for, map, forEach) | ~50% of call cost |
| **oversized-prompt** | Prompts exceeding 2000 tokens | ~40% of overage cost |

### Export reports

Generate reports for your team or CI pipeline:

```bash
# HTML report with charts
ai-audit ./your-project --deep --format html --output report.html

# JSON for programmatic processing
ai-audit ./your-project --format json --output audit.json

# Markdown for PRs or wikis
ai-audit ./your-project --format markdown --output report.md
```

### Customize assumptions

The default estimates assume 1000 calls/month, 500 input tokens, and 200 output tokens per call site. Adjust to match your actual usage:

```bash
ai-audit ./your-project --calls-per-month 5000 --avg-input-tokens 800 --avg-output-tokens 300
```

Or create a `.promptosrc.json` in your project root:

```json
{
  "callsPerMonth": 5000,
  "avgInputTokens": 800,
  "avgOutputTokens": 300,
  "format": "html",
  "deep": true,
  "promptTokenThreshold": 3000,
  "exclude": ["vendor/**", "generated/**"]
}
```

### Use the API programmatically

```typescript
import { scan, estimateCosts, formatReport } from '@prompt-os/ai-audit';

const scanResult = await scan('./src');

const costReport = estimateCosts(scanResult, {
  callsPerMonth: 1000,
  avgInputTokens: 500,
  avgOutputTokens: 200,
});

const report = {
  version: '0.1.0',
  timestamp: new Date().toISOString(),
  targetPath: './src',
  scan: scanResult,
  cost: costReport,
};

console.log(formatReport(report, 'terminal'));
```

---

## Phase 2: Optimize with the SDK

Once you know where your costs are, wrap your LLM clients with the SDK to reduce them.

### Install

```bash
bun add @prompt-os/sdk

# Plus your provider SDK
bun add openai        # for OpenAI
bun add @anthropic-ai/sdk  # for Anthropic
```

### Step 1: Wrap your existing client

Replace your direct OpenAI/Anthropic client with a PromptOS-wrapped one. The API stays the same:

```typescript
import { createClient } from '@prompt-os/sdk';

const client = await createClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
});

// Use it exactly like the OpenAI SDK
const result = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

For Anthropic:

```typescript
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

### Step 2: Enable caching

If the audit found repeated or redundant calls, enable the in-memory cache:

```typescript
const client = await createClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  cache: {
    enabled: true,
    ttlMs: 300000,    // 5 minutes (default)
    maxEntries: 100,  // LRU eviction after 100 entries (default)
  },
});
```

Identical requests (same model, messages, and parameters) return cached responses instantly. The cache key is a SHA256 hash of the full request.

### Step 3: Add compression and token budgets

If the audit found oversized prompts, enable compression with a token budget:

```typescript
const client = await createClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  cache: { enabled: true },
  compression: {
    enabled: true,
    strategy: 'sentence',  // or 'trim'
  },
  tokenBudget: {
    maxInputTokens: 4000,
  },
});
```

When input exceeds the budget:
- With compression enabled, messages are automatically trimmed to fit (system messages are preserved)
- Without compression, a `TokenBudgetExceededError` is thrown so you can handle it

**Compression strategies:**

| Strategy | Behavior |
|----------|----------|
| `trim` | Removes characters from the end of messages until under budget |
| `sentence` | Removes full sentences from the end, respecting sentence boundaries |

### Step 4: Handle errors

```typescript
import { createClient, TokenBudgetExceededError, ProviderNotInstalledError } from '@prompt-os/sdk';

try {
  const client = await createClient({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    tokenBudget: { maxInputTokens: 2000 },
  });

  await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: veryLongText }],
  });
} catch (err) {
  if (err instanceof TokenBudgetExceededError) {
    console.log(`${err.tokenCount} tokens exceeds limit of ${err.maxTokens}`);
    // Consider enabling compression or increasing the budget
  }
  if (err instanceof ProviderNotInstalledError) {
    // SDK package (openai or @anthropic-ai/sdk) is not installed
    console.log(err.message); // includes install instructions
  }
}
```

---

## Phase 3: Route Across Providers

Add the router for automatic model selection, multi-provider fallback, and health-aware routing.

### Install

```bash
bun add @prompt-os/router

# Install the providers you want to route between
bun add openai @anthropic-ai/sdk
```

### Step 1: Create a router

```typescript
import { createRouter } from '@prompt-os/router';

const router = createRouter({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
  },
  routing: {
    strategy: 'balanced',
    fallbackChain: ['openai', 'anthropic'],
  },
});
```

### Step 2: Send requests

```typescript
const response = await router.complete({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain microservices in one paragraph.' },
  ],
});

console.log(response.content);
```

The router automatically:
1. Classifies the request complexity (simple, moderate, complex)
2. Selects the optimal model based on your strategy
3. Tries the primary provider, falls back to alternatives on failure

### Step 3: Choose a routing strategy

| Strategy | When to use | Behavior |
|----------|------------|----------|
| `cost-optimized` | Minimize spend | Uses cheaper models (gpt-4o-mini, claude-haiku-4-5) for simple/moderate requests |
| `quality-first` | Maximize output quality | Always uses top-tier models (gpt-4o, claude-sonnet-4-5) |
| `balanced` | Default, good tradeoff | Cheap models for simple, strong models for moderate/complex |

Model selection by strategy and complexity:

| Complexity | `cost-optimized` | `balanced` | `quality-first` |
|------------|-------------------|------------|-----------------|
| simple | gpt-4o-mini / claude-haiku-4-5 | gpt-4o-mini / claude-haiku-4-5 | gpt-4o / claude-sonnet-4-5 |
| moderate | gpt-4o-mini / claude-haiku-4-5 | gpt-4o / claude-sonnet-4-5 | gpt-4o / claude-sonnet-4-5 |
| complex | gpt-4o / claude-sonnet-4-5 | gpt-4o / claude-sonnet-4-5 | gpt-4o / claude-sonnet-4-5 |

### Step 4: Inspect routing decisions

Every response includes metadata about the routing decision:

```typescript
const response = await router.complete({
  messages: [{ role: 'user', content: 'What is 2+2?' }],
});

// What complexity was detected?
console.log(response.routing.complexity.level);      // 'simple'
console.log(response.routing.complexity.confidence);  // 0.92

// Which model and provider were used?
console.log(response.routing.selectedModel);     // 'gpt-4o-mini'
console.log(response.routing.selectedProvider);  // 'openai'

// How long did it take?
console.log(response.routing.totalLatencyMs);    // 450

// Were there fallback attempts?
for (const attempt of response.routing.attempts) {
  console.log(`${attempt.provider}: ${attempt.success ? 'ok' : attempt.error} (${attempt.latencyMs}ms)`);
}
```

### Step 5: Monitor provider health

The router tracks provider health with a sliding time window. Unhealthy providers are deprioritized in the fallback chain.

```typescript
// Check health status
const health = router.getHealthStatus('openai');
console.log(health.healthy);       // true/false
console.log(health.successRate);   // 0.95
console.log(health.totalRequests); // 47

// Reset health after a known outage resolves
router.resetHealth('openai');
```

Configure health tracking thresholds:

```typescript
const router = createRouter({
  providers: { /* ... */ },
  routing: { strategy: 'balanced' },
  healthCheck: {
    windowSizeMs: 60000,     // 60-second sliding window (default)
    maxWindowEntries: 100,   // Max entries per provider (default)
    failureThreshold: 0.5,   // Mark unhealthy at 50% failures (default)
  },
});
```

### Step 6: Handle failures

```typescript
import { createRouter, AllProvidersFailedError } from '@prompt-os/router';

try {
  const response = await router.complete({
    messages: [{ role: 'user', content: 'Hello' }],
  });
} catch (err) {
  if (err instanceof AllProvidersFailedError) {
    // All providers in the fallback chain failed
    for (const attempt of err.routingAttempts) {
      console.error(`${attempt.provider}/${attempt.model}: ${attempt.error}`);
    }
  }
}
```

---

## Putting It All Together

A typical adoption path:

```
Week 1: Run ai-audit to understand your LLM spend
         → Identify top cost drivers and optimization opportunities

Week 2: Wrap your clients with @prompt-os/sdk
         → Enable caching for repeated calls
         → Add token budgets for oversized prompts

Week 3: Set up @prompt-os/router
         → Route simple queries to cheaper models
         → Add fallback between OpenAI and Anthropic
         → Monitor provider health
```

### Full example

```typescript
import { scan, estimateCosts } from '@prompt-os/ai-audit';
import { createClient } from '@prompt-os/sdk';
import { createRouter } from '@prompt-os/router';

// 1. Audit: understand your current spend
const scanResult = await scan('./src');
const costs = estimateCosts(scanResult, {
  callsPerMonth: 5000,
  avgInputTokens: 800,
  avgOutputTokens: 300,
});
console.log(`Monthly LLM spend: $${costs.totalMonthlyCostUSD.toFixed(2)}`);

// 2. Optimize: wrap clients with caching and budgets
const client = await createClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  cache: { enabled: true },
  compression: { enabled: true, strategy: 'sentence' },
  tokenBudget: { maxInputTokens: 4000 },
});

// 3. Route: smart model selection with fallback
const router = createRouter({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
  },
  routing: {
    strategy: 'balanced',
    fallbackChain: ['openai', 'anthropic'],
  },
});

const response = await router.complete({
  messages: [{ role: 'user', content: 'Summarize this document...' }],
});

console.log(response.content);
console.log(`Model: ${response.routing.selectedModel}`);
console.log(`Complexity: ${response.routing.complexity.level}`);
console.log(`Latency: ${response.routing.totalLatencyMs}ms`);
```

---

## Supported Providers

| Provider | Audit detection | SDK wrapping | Router support |
|----------|----------------|--------------|----------------|
| OpenAI | Yes | Yes | Yes |
| Anthropic | Yes | Yes | Yes |
| Google | Yes | -- | -- |
| LangChain | Yes | -- | -- |

---

## Next Steps

- See individual package READMEs for complete API reference: [ai-audit](./packages/ai-audit/), [sdk](./packages/sdk/), [router](./packages/router/)
- See [CONTRIBUTING.md](./.github/CONTRIBUTING.md) for development setup
