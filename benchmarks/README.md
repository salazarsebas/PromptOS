# Benchmarks

Performance benchmarks for PromptOS internals.

## Prerequisites

- Bun installed
- Run `bun install` and `bun run build` from the monorepo root

## Usage

```bash
# Run all benchmarks
bun run bench:all

# Run individual benchmarks
bun run bench:cache
bun run bench:compression
bun run bench:tokens
bun run bench:classifier
```

## Benchmarks

| Benchmark | Package | What it measures |
|-----------|---------|------------------|
| `cache-latency.ts` | `@prompt-os/sdk` | MemoryCache hit/miss/set latency (p50/p95/p99 in µs) over 100k iterations |
| `compression-throughput.ts` | `@prompt-os/sdk` | `compressMessages` throughput for trim/sentence strategies at 100-10k tokens |
| `token-estimation-accuracy.ts` | `@prompt-os/shared` | `estimateTokens` vs `estimateTokensFast` accuracy and speed across text types |
| `classifier-speed.ts` | `@prompt-os/router` | `classifyComplexity` throughput for simple/moderate/complex messages |
