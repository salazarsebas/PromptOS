# Example: SDK Caching

Demonstrates the PromptOS SDK with caching, prompt compression, and token budget enforcement.

## Prerequisites

- Bun installed
- Run `bun install` from the monorepo root
- `OPENAI_API_KEY` environment variable set

## Usage

```bash
export OPENAI_API_KEY="sk-..."
bun run start
```

## What it does

1. Creates a wrapped OpenAI client with caching, sentence compression, and a 4,000 token budget
2. Sends a first request (cache miss — calls the OpenAI API)
3. Sends an identical request (cache hit — returns instantly from memory)
4. Sends an oversized request to demonstrate budget enforcement
