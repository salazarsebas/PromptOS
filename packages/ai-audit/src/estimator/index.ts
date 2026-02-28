import type { CostReport, ScanResult } from '@prompt-os/shared';
import { calculateCosts, type EstimationOptions } from './cost-calculator.js';

export type { EstimationOptions };

export function estimateCosts(scanResult: ScanResult, options: EstimationOptions): CostReport {
  return calculateCosts(scanResult.calls, options);
}
