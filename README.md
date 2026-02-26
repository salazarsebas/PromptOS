# PromptOS

> Reduce the marginal cost of using AI. The infrastructure layer for LLM efficiency.

PromptOS is an AI Infrastructure Efficiency Stack that helps teams audit, optimize, and route their LLM usage — turning overspending into measurable savings.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`@promptos/ai-audit`](./packages/ai-audit/) | CLI tool to scan codebases for LLM usage and estimate costs | Phase 1 |
| [`@promptos/shared`](./packages/shared/) | Shared types, constants, and utilities | Phase 1 |
| `@promptos/sdk` | Optimization middleware (caching, compression, budgeting) | Phase 3 |
| `@promptos/router` | Smart routing engine (model selection, fallbacks, batching) | Phase 4 |

## Quick Start

```bash
# Install the audit CLI
bun add -g @promptos/ai-audit

# Scan your project
ai-audit ./your-project

# Get JSON output
ai-audit ./your-project --format json --output report.json
```

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun run test

# Lint and format
bun run lint
bun run format

# Type check
bun run typecheck
```

## Architecture

```
@promptos/shared        (types, pricing, utilities)
    |
    +-- @promptos/ai-audit     (CLI audit tool)
    |
    +-- @promptos/sdk          (optimization middleware)
         |
         +-- @promptos/router  (smart routing engine)
```

## License

MIT
