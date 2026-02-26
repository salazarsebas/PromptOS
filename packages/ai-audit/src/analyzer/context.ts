import type {
  CostEstimate,
  DetectedCall,
  OptimizationOpportunity,
  PromptOSConfig,
} from '@promptos/shared';
import type { SourceFile } from 'ts-morph';

export interface AnalyzerContext {
  calls: DetectedCall[];
  costEstimates: CostEstimate[];
  sourceFiles: Map<string, SourceFile>;
  config: ResolvedAnalyzerConfig;
}

export interface ResolvedAnalyzerConfig {
  promptTokenThreshold: number;
  callsPerMonth: number;
  avgInputTokens: number;
  avgOutputTokens: number;
}

export type Analyzer = (context: AnalyzerContext) => OptimizationOpportunity[];

const DEFAULTS: ResolvedAnalyzerConfig = {
  promptTokenThreshold: 2000,
  callsPerMonth: 1000,
  avgInputTokens: 500,
  avgOutputTokens: 200,
};

export function resolveAnalyzerConfig(config: PromptOSConfig): ResolvedAnalyzerConfig {
  return {
    promptTokenThreshold: config.promptTokenThreshold ?? DEFAULTS.promptTokenThreshold,
    callsPerMonth: config.callsPerMonth ?? DEFAULTS.callsPerMonth,
    avgInputTokens: config.avgInputTokens ?? DEFAULTS.avgInputTokens,
    avgOutputTokens: config.avgOutputTokens ?? DEFAULTS.avgOutputTokens,
  };
}
