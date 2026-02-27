# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-26

### Added

#### @promptos/shared
- Token estimation utilities (`estimateTokens`, `estimateTokensFast`)
- Model pricing constants for OpenAI, Anthropic, and Google models
- Shared TypeScript types for the PromptOS ecosystem
- File collection utilities for directory scanning

#### @promptos/ai-audit
- CLI scanner that detects LLM API calls via AST analysis (`ts-morph`)
- Cost estimation engine with per-model pricing breakdowns
- Deep analysis mode (`--deep`) for optimization opportunity detection
- Multiple report formats: terminal, JSON, Markdown, HTML
- Configurable via `.promptosrc.json`

#### @promptos/sdk
- `createClient()` wrapper for OpenAI and Anthropic SDKs
- In-memory LRU cache middleware with configurable TTL
- Prompt compression middleware (trim and sentence strategies)
- Token budget enforcement middleware
- Composable middleware pipeline

#### @promptos/router
- `createRouter()` for intelligent multi-provider routing
- Complexity classifier with weighted signal analysis
- Three routing strategies: `cost-optimized`, `quality-first`, `balanced`
- Fallback chain execution with automatic provider failover
- Health tracking with sliding window metrics

[0.1.0]: https://github.com/salazarsebas/prompos/releases/tag/v0.1.0
