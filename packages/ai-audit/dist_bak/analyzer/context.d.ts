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
export declare function resolveAnalyzerConfig(config: PromptOSConfig): ResolvedAnalyzerConfig;
//# sourceMappingURL=context.d.ts.map
