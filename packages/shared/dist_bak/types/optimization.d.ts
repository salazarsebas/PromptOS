export type OptimizationType =
  | 'redundant-context'
  | 'missing-cache'
  | 'oversized-prompt'
  | 'model-downgrade';
export type OpportunitySeverity = 'high' | 'medium' | 'low';
export interface OptimizationOpportunity {
  type: OptimizationType;
  severity: OpportunitySeverity;
  filePath: string;
  line: number;
  description: string;
  suggestion: string;
  estimatedMonthlySavingsUSD: number;
}
export interface DeepAnalysisResult {
  opportunities: OptimizationOpportunity[];
  totalEstimatedSavingsUSD: number;
}
//# sourceMappingURL=optimization.d.ts.map
