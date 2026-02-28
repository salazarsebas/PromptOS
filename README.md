# PromptOS

[![CI](https://github.com/salazarsebas/prompos/actions/workflows/ci.yml/badge.svg)](https://github.com/salazarsebas/prompos/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm @prompt-os/ai-audit](https://img.shields.io/npm/v/@prompt-os/ai-audit.svg?label=ai-audit)](https://www.npmjs.com/package/@prompt-os/ai-audit)
[![npm @prompt-os/sdk](https://img.shields.io/npm/v/@prompt-os/sdk.svg?label=sdk)](https://www.npmjs.com/package/@prompt-os/sdk)
[![npm @prompt-os/router](https://img.shields.io/npm/v/@prompt-os/router.svg?label=router)](https://www.npmjs.com/package/@prompt-os/router)

**Reduce the marginal cost of using AI.** The infrastructure layer for LLM efficiency.

PromptOS is an AI infrastructure stack that helps teams audit, optimize, and route their LLM usage -- turning overspending into measurable savings. It provides a CLI scanner, an optimization SDK, and an intelligent routing layer, all working together as a monorepo.

## Packages

| Package | Description |
|---------|-------------|
| [`@prompt-os/ai-audit`](./packages/ai-audit/) | CLI tool that scans codebases for LLM API calls and estimates monthly costs |
| [`@prompt-os/sdk`](./packages/sdk/) | Middleware wrapper for OpenAI/Anthropic with caching, compression, and token budgets |
| [`@prompt-os/router`](./packages/router/) | Intelligent routing between providers with fallback chains and health tracking |
| [`@prompt-os/shared`](./packages/shared/) | Shared types, pricing constants, and utilities |

For a complete step-by-step walkthrough, see the **[Usage Guide](./GUIDE.md)**.

## Why PromptOS?

| Feature | PromptOS | LiteLLM | Helicone | Portkey |
|---------|----------|---------|----------|---------|
| **Audit-first approach** — scan existing code before changing it | Yes | No | No | No |
| **Zero infrastructure** — no proxy servers, no SaaS dashboard | Yes | Proxy required | SaaS | SaaS |
| **Drop-in replacement** — same API as OpenAI/Anthropic SDKs | Yes | Own API | Proxy header | Gateway |
| **Offline cost estimation** — estimate spend without running code | Yes | No | No | No |
| **Client-side caching & compression** — reduce tokens before they leave | Yes | No | No | No |
| **Complexity-based routing** — auto-select model tier per request | Yes | Manual rules | No | Manual rules |

PromptOS is designed for teams that want to **understand their LLM spend first**, then **optimize it programmatically** — all without adding infrastructure dependencies.

## Quick Start

### Audit your LLM spend

```bash
bun add -g @prompt-os/ai-audit

ai-audit ./your-project
ai-audit ./your-project --deep --format html --output report.html
```

### Wrap your client with caching and budgets

```typescript
import { createClient } from '@prompt-os/sdk';

const client = await createClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  cache: { enabled: true },
  compression: { enabled: true, strategy: 'sentence' },
  tokenBudget: { maxInputTokens: 4000 },
});

// Same API as the OpenAI SDK -- middleware runs transparently
const result = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
});
```

### Route across providers with automatic fallback

```typescript
import { createRouter } from '@prompt-os/router';

const router = createRouter({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
  },
  routing: { strategy: 'balanced' },
});

const response = await router.complete({
  messages: [{ role: 'user', content: 'Explain microservices.' }],
});

console.log(response.content);
console.log(response.routing.complexity.level);  // simple | moderate | complex
console.log(response.routing.selectedModel);      // e.g. gpt-4o-mini
```

## Architecture

```
@prompt-os/shared           types, pricing data, token utilities
    |
    +-- @prompt-os/ai-audit     CLI scanner + cost estimator + deep analyzer
    |
    +-- @prompt-os/sdk          caching, compression, budget middleware
         |
         +-- @prompt-os/router  complexity classifier, strategy routing, fallback, health tracking
```

All packages are TypeScript, built with `tsc`, tested with Vitest, and linted with Biome.

## Development

```bash
# Prerequisites: Bun, Node 18+

# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun run test

# Lint and format
bun run lint
bun run lint:fix

# Type check
bun run typecheck
```

See [CONTRIBUTING.md](./.github/CONTRIBUTING.md) for detailed development guidelines.

## Links

- [Usage Guide](./GUIDE.md) — step-by-step walkthrough
- [Changelog](./CHANGELOG.md) — release history
- [Security Policy](./SECURITY.md) — vulnerability reporting
- [Contributing](./.github/CONTRIBUTING.md) — development guidelines

## License

[MIT](./LICENSE)
