import type { HealthCheckConfig, HealthStatus, RouterProvider } from '../types.js';
export declare class HealthTracker {
  private readonly entries;
  private readonly windowSizeMs;
  private readonly maxWindowEntries;
  private readonly failureThreshold;
  private readonly now;
  constructor(config?: HealthCheckConfig, now?: () => number);
  record(provider: RouterProvider, success: boolean): void;
  getStatus(provider: RouterProvider): HealthStatus;
  getAllStatuses(): Map<RouterProvider, HealthStatus>;
  reset(provider?: RouterProvider): void;
}
//# sourceMappingURL=health-tracker.d.ts.map
