import type { CostEstimate, CostReport, DetectedCall } from '@promptos/shared';
/**
 * Filter calls and align cost estimates for analyzer testing.
 */
export declare function filterCallsWithEstimates(
  scanCalls: DetectedCall[],
  costReport: CostReport,
  predicate: (call: DetectedCall) => boolean,
): {
  calls: DetectedCall[];
  estimates: CostEstimate[];
};
//# sourceMappingURL=test-helpers.d.ts.map
