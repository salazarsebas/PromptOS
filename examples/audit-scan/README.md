# Example: Audit Scan

Scan a project directory for LLM API calls and estimate monthly costs.

## Prerequisites

- Bun installed
- Run `bun install` from the monorepo root

## Usage

```bash
# Scan the monorepo itself
bun run start ../..

# Scan a specific directory with a different format
bun run scan-project.ts /path/to/project markdown
```

## What it does

1. Scans the target directory for OpenAI, Anthropic, and Google LLM API calls using AST analysis
2. Estimates monthly costs based on 10,000 calls/month with 500 input / 200 output tokens per call
3. Prints a formatted report to the console
