# @promptos/ai-audit

Scan codebases for LLM API usage and estimate monthly costs.

---

`ai-audit` performs AST-based static analysis to detect OpenAI, Anthropic, Google, and LangChain API calls across your codebase, then generates a cost report with estimated monthly spend.

## Installation

```bash
bun add -g @promptos/ai-audit
```

Or use it programmatically:

```bash
bun add @promptos/ai-audit
```

## CLI Usage

```bash
ai-audit <directory> [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `<directory>` | Directory to scan (required) | |
| `-f, --format <format>` | Output format: `terminal`, `json`, `markdown`, `html` | `terminal` |
| `-o, --output <path>` | Write report to file instead of stdout | |
| `--deep` | Run deep analysis to detect optimization opportunities | `false` |
| `--config <path>` | Path to `.promptosrc.json` config file | auto-discovered |
| `--calls-per-month <number>` | Assumed calls per month per call site | `1000` |
| `--avg-input-tokens <number>` | Assumed average input tokens per call | `500` |
| `--avg-output-tokens <number>` | Assumed average output tokens per call | `200` |

### Examples

```bash
# Basic scan with terminal output
ai-audit ./my-project

# Generate HTML report
ai-audit ./my-project --format html --output report.html

# Deep analysis with custom assumptions
ai-audit ./src --deep --calls-per-month 5000 --avg-input-tokens 800

# JSON output for CI integration
ai-audit . --format json --output audit.json
```

### Example Output

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

## Configuration

Create a `.promptosrc.json` in your project root (auto-discovered in parent directories):

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

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `callsPerMonth` | `number` | `1000` | Assumed calls per site per month |
| `avgInputTokens` | `number` | `500` | Average input tokens per call |
| `avgOutputTokens` | `number` | `200` | Average output tokens per call |
| `format` | `'terminal' \| 'json' \| 'markdown' \| 'html'` | `'terminal'` | Output format |
| `deep` | `boolean` | `false` | Enable deep analysis |
| `promptTokenThreshold` | `number` | `2000` | Token threshold for oversized-prompt detection |
| `exclude` | `string[]` | `[]` | Glob patterns to exclude from scan |

CLI flags override config file values.

## Output Formats

| Format | Description |
|--------|-------------|
| `terminal` | Colored console output with provider summary and cost breakdown |
| `json` | Full `AuditReport` object as pretty-printed JSON |
| `markdown` | Table-based markdown with summary, providers, cost drivers, and opportunities |
| `html` | Self-contained dark-theme HTML with summary cards, tables, and severity badges |

## Deep Analysis

Enable with `--deep` to detect optimization opportunities:

### Model Downgrade

Identifies expensive models used for short prompts (< 500 tokens) and suggests cheaper alternatives:

| From | To |
|------|----|
| `gpt-4o` | `gpt-4o-mini` |
| `gpt-4-turbo` | `gpt-4o-mini` |
| `claude-sonnet-4-5` | `claude-haiku-4-5` |
| `claude-opus-4-5` | `claude-sonnet-4-5` |
| `claude-3-opus` | `claude-3-sonnet` |
| `gemini-2.5-pro` | `gemini-2.5-flash` |
| `o1` | `o3-mini` |

### Redundant Context

Detects identical system prompts duplicated across multiple call sites. Suggests extracting to a shared constant and using prompt caching. Estimates 30% savings on input costs per duplicate.

### Missing Cache

Finds LLM calls inside loops (`for`, `while`, `do`) and iteration methods (`.map()`, `.forEach()`, `.filter()`, `.reduce()`). Suggests batching or caching. Estimates 50% savings.

### Oversized Prompt

Flags prompts exceeding the token threshold (default: 2000 tokens). Suggests compression or summarization. Estimates 40% savings on the overage.

Each opportunity includes a severity (`high`, `medium`, `low`) and estimated monthly savings.

## Programmatic API

```typescript
import { scan, estimateCosts, formatReport } from '@promptos/ai-audit';

// 1. Scan a directory
const scanResult = await scan('./src');

// 2. Estimate costs
const costReport = estimateCosts(scanResult, {
  callsPerMonth: 1000,
  avgInputTokens: 500,
  avgOutputTokens: 200,
});

// 3. Format the report
const report = {
  version: '0.1.0',
  timestamp: new Date().toISOString(),
  targetPath: './src',
  scan: scanResult,
  cost: costReport,
};

const output = formatReport(report, 'markdown');
console.log(output);
```

### `scan(targetPath, ignoreDirs?)`

Performs AST-based static analysis to detect all LLM API calls.

Returns `ScanResult`:

```typescript
{
  scannedFiles: number;
  skippedFiles: number;
  totalCalls: number;
  calls: DetectedCall[];
  scanDurationMs: number;
  errors: ScanError[];
}
```

### `estimateCosts(scanResult, options)`

Calculates estimated monthly costs.

Returns `CostReport`:

```typescript
{
  totalMonthlyCostUSD: number;
  byProvider: Record<string, ProviderCostSummary>;
  topCostDrivers: CostEstimate[];
  estimates: CostEstimate[];
}
```

### `formatReport(report, format)`

Renders an `AuditReport` in the specified format (`terminal`, `json`, `markdown`, `html`).

## Supported Providers

| Provider | Import Patterns | Detected Methods |
|----------|----------------|-----------------|
| OpenAI | `openai`, `@openai/client` | `chat.completions.create()`, `completions.create()`, `embeddings.create()` |
| Anthropic | `@anthropic-ai/sdk` | `messages.create()`, `completions.create()` |
| Google | `@google/generative-ai`, `@google-cloud/vertexai` | `generateContent()`, `sendMessage()` |
| LangChain | `langchain`, `@langchain/core`, `@langchain/openai`, `@langchain/anthropic` | `invoke()`, `call()` |

## License

[MIT](../../LICENSE)
