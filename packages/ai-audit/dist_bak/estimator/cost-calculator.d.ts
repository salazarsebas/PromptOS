import type { CostReport, DetectedCall } from '@promptos/shared';
export interface EstimationOptions {
  callsPerMonth: number;
  avgInputTokens: number;
  avgOutputTokens: number;
}
export declare function calculateCosts(
  calls: DetectedCall[],
  options: EstimationOptions,
): CostReport;
//# sourceMappingURL=cost-calculator.d.ts.map
