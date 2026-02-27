# Contributing to PromptOS

## Prerequisites

- [Bun](https://bun.sh/) (latest)
- Node.js 18+

## Setup

```bash
git clone https://github.com/your-org/promptos.git
cd promptos
bun install
```

## Development Workflow

```bash
# Build all packages (required before running tests)
bun run build

# Run all tests
bun run test

# Watch mode for tests
bun run test:watch

# Lint with Biome
bun run lint

# Auto-fix lint and formatting issues
bun run lint:fix

# Format code
bun run format

# Type check
bun run typecheck
```

All four checks (build, test, lint, typecheck) should pass before submitting a PR.

## Monorepo Structure

```
promptos/
├── packages/
│   ├── shared/        Shared types, pricing constants, utilities
│   ├── ai-audit/      CLI scanner and cost estimator
│   ├── sdk/           Middleware wrapper (cache, compression, budget)
│   └── router/        Intelligent routing with fallback and health tracking
├── package.json       Root workspace config and dev scripts
├── tsconfig.json      Root TypeScript project references
├── biome.json         Biome linter and formatter config
└── LICENSE
```

### Dependency Graph

`shared` is the base. `ai-audit` and `sdk` depend on `shared`. `router` depends on both `shared` and `sdk`.

## Conventions

### Code Style

- **Formatter/Linter**: Biome (single quotes, semicolons)
- **Language**: TypeScript (strict mode)
- **Module format**: ESM (`"type": "module"`)
- **Build tool**: `tsc -b` with project references

### Testing

- **Framework**: Vitest
- **Location**: Test files live next to source files as `*.test.ts`
- **Naming**: Describe blocks match the module name, test names describe behavior

To add a test:

```bash
# Create a test file next to the source
touch packages/sdk/src/my-feature.test.ts
```

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './my-feature.js';

describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

Run with `bun run test` or `bunx vitest run packages/sdk` for a single package.

### Adding a Provider

Providers are defined in `packages/shared/src/constants/`:

1. Add model pricing entries to `pricing.ts` (`MODEL_PRICING` array)
2. Add detection patterns to `providers.ts` (`PROVIDERS` array)
3. Add provider type to `packages/shared/src/types/provider.ts`
4. Add AST patterns to `packages/ai-audit/src/scanner/` if the provider has a new SDK call pattern
5. Add tests covering the new provider detection and pricing

For router support, also add:

6. An adapter in `packages/router/src/provider/`
7. Model tier mappings in `packages/router/src/strategy/model-tiers.ts`
