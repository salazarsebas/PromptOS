# Example: Router Fallback

Demonstrates the PromptOS router with complexity-based model selection, multi-provider routing, and health tracking.

## Prerequisites

- Bun installed
- Run `bun install` from the monorepo root
- `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` environment variables set

## Usage

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
bun run start
```

## What it does

1. Creates a router with the `balanced` strategy and a fallback chain (OpenAI -> Anthropic)
2. Sends a simple request — routes to a smaller, cheaper model
3. Sends a complex request — routes to a larger, more capable model
4. Prints provider health status showing success/failure counts
