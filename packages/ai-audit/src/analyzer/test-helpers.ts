import type { CostEstimate, CostReport, DetectedCall } from '@prompt-os/shared';

/**
 * Filter calls and align cost estimates for analyzer testing.
 */
export function filterCallsWithEstimates(
  scanCalls: DetectedCall[],
  costReport: CostReport,
  predicate: (call: DetectedCall) => boolean,
): { calls: DetectedCall[]; estimates: CostEstimate[] } {
  const calls: DetectedCall[] = [];
  const estimates: CostEstimate[] = [];

  for (let i = 0; i < scanCalls.length; i++) {
    const call = scanCalls[i];
    if (call && predicate(call)) {
      calls.push(call);
      const estimate = costReport.estimates[i];
      if (estimate) estimates.push(estimate);
    }
  }

  return { calls, estimates };
}
