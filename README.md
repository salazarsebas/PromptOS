# PromptOS

**Reduce the marginal cost of using AI.** The infrastructure layer for LLM efficiency.

PromptOS is an AI infrastructure stack that helps teams audit, optimize, and route their LLM usage -- turning overspending into measurable savings. It provides a CLI scanner, an optimization SDK, and an intelligent routing layer, all working together as a monorepo.

## Packages

| Package | Description |
|---------|-------------|
| [`@promptos/ai-audit`](./packages/ai-audit/) | CLI tool that scans codebases for LLM API calls and estimates monthly costs |
| [`@promptos/sdk`](./packages/sdk/) | Middleware wrapper for OpenAI/Anthropic with caching, compression, and token budgets |
| [`@promptos/router`](./packages/router/) | Intelligent routing between providers with fallback chains and health tracking |
| [`@promptos/shared`](./packages/shared/) | Shared types, pricing constants, and utilities |

For a complete step-by-step walkthrough, see the **[Usage Guide](./GUIDE.md)**.

## Quick Start

### Audit your LLM spend

```bash
bun add -g @promptos/ai-audit

ai-audit ./your-project
ai-audit ./your-project --deep --format html --output report.html
```

### Wrap your client with caching and budgets

```typescript
import { createClient } from '@promptos/sdk';

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
import { createRouter } from '@promptos/router';

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
@promptos/shared           types, pricing data, token utilities
    |
    +-- @promptos/ai-audit     CLI scanner + cost estimator + deep analyzer
    |
    +-- @promptos/sdk          caching, compression, budget middleware
         |
         +-- @promptos/router  complexity classifier, strategy routing, fallback, health tracking
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

## License

[MIT](./LICENSE)
