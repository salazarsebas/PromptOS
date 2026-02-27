# @promptos/shared

Shared types, pricing constants, and utilities used internally by PromptOS packages.

---

> This package is consumed internally by the other packages in the PromptOS monorepo. You typically don't need to install it directly.

## Installation

```bash
bun add @promptos/shared
```

## Exports

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `getPricing` | `(model: string) => ModelPricing \| undefined` | Look up pricing for a model by name |
| `getDefaultModel` | `(provider: string, category: string) => string` | Get the default model for a provider and call category |
| `estimateTokens` | `(text: string) => number` | Accurate token count using `gpt-tokenizer` |
| `estimateTokensFast` | `(charCount: number) => number` | Fast estimation (~1 token per 4 characters) |
| `collectFiles` | `(dirPath: string, extensions?: Set<string>, ignoreDirs?: Set<string>) => Promise<string[]>` | Recursively collect files matching given extensions |

### Constants

#### `MODEL_PRICING`

Complete pricing database for all supported models (per 1M tokens):

| Provider | Model | Input | Output | Category |
|----------|-------|-------|--------|----------|
| OpenAI | `gpt-4o` | $2.50 | $10.00 | chat |
| OpenAI | `gpt-4o-mini` | $0.15 | $0.60 | chat |
| OpenAI | `gpt-4-turbo` | $10.00 | $30.00 | chat |
| OpenAI | `gpt-3.5-turbo` | $0.50 | $1.50 | chat |
| OpenAI | `o1` | $15.00 | $60.00 | chat |
| OpenAI | `o1-mini` | $3.00 | $12.00 | chat |
| OpenAI | `o3-mini` | $1.10 | $4.40 | chat |
| OpenAI | `text-embedding-3-small` | $0.02 | $0.00 | embedding |
| OpenAI | `text-embedding-3-large` | $0.13 | $0.00 | embedding |
| OpenAI | `text-embedding-ada-002` | $0.10 | $0.00 | embedding |
| Anthropic | `claude-opus-4-5` | $15.00 | $75.00 | chat |
| Anthropic | `claude-sonnet-4-5` | $3.00 | $15.00 | chat |
| Anthropic | `claude-haiku-4-5` | $0.80 | $4.00 | chat |
| Anthropic | `claude-3-opus` | $15.00 | $75.00 | chat |
| Anthropic | `claude-3-sonnet` | $3.00 | $15.00 | chat |
| Anthropic | `claude-3-haiku` | $0.25 | $1.25 | chat |
| Google | `gemini-2.5-pro` | $1.25 | $10.00 | chat |
| Google | `gemini-2.5-flash` | $0.15 | $0.60 | chat |
| Google | `gemini-2.0-flash` | $0.10 | $0.40 | chat |

#### `PROVIDERS`

Detection patterns for AST-based API call scanning across four providers: OpenAI, Anthropic, Google, and LangChain.

### Types

Types are organized by domain and re-exported from the package root:

| Category | Key Types |
|----------|-----------|
| Provider | `Provider`, `OpenAIModel`, `AnthropicModel`, `GoogleModel`, `CallCategory`, `ProviderInfo` |
| Cost | `ModelPricing`, `CostEstimate`, `CostReport`, `ProviderCostSummary` |
| Detection | `DetectedCall`, `ScanResult`, `ScanError` |
| Optimization | `OptimizationType`, `OptimizationOpportunity`, `DeepAnalysisResult` |
| Report | `AuditReport`, `ReportFormat` |
| Router | `RouterConfig`, `RouterRequest`, `RouterResponse`, `RoutingStrategy`, `ComplexityLevel`, `HealthStatus` |
| SDK | `SdkClientConfig`, `Middleware`, `MiddlewareContext`, `CacheConfig`, `CompressionConfig`, `TokenBudgetConfig` |
| Config | `PromptOSConfig` |

## License

[MIT](../../LICENSE)
