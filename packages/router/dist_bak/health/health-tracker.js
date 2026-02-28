const DEFAULT_WINDOW_SIZE_MS = 60_000;
const DEFAULT_MAX_WINDOW_ENTRIES = 100;
const DEFAULT_FAILURE_THRESHOLD = 0.5;
export class HealthTracker {
  entries = new Map();
  windowSizeMs;
  maxWindowEntries;
  failureThreshold;
  now;
  constructor(config, now) {
    this.windowSizeMs = config?.windowSizeMs ?? DEFAULT_WINDOW_SIZE_MS;
    this.maxWindowEntries = config?.maxWindowEntries ?? DEFAULT_MAX_WINDOW_ENTRIES;
    this.failureThreshold = config?.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this.now = now ?? Date.now;
  }
  record(provider, success) {
    let list = this.entries.get(provider);
    if (!list) {
      list = [];
      this.entries.set(provider, list);
    }
    list.push({ timestamp: this.now(), success });
    // Trim to max entries
    if (list.length > this.maxWindowEntries) {
      list.splice(0, list.length - this.maxWindowEntries);
    }
  }
  getStatus(provider) {
    const list = this.entries.get(provider);
    if (!list || list.length === 0) {
      return {
        provider,
        healthy: true,
        successRate: 1,
        totalRequests: 0,
        windowStart: this.now(),
      };
    }
    const cutoff = this.now() - this.windowSizeMs;
    const windowEntries = list.filter((e) => e.timestamp >= cutoff);
    if (windowEntries.length === 0) {
      return {
        provider,
        healthy: true,
        successRate: 1,
        totalRequests: 0,
        windowStart: cutoff,
      };
    }
    const successes = windowEntries.filter((e) => e.success).length;
    const successRate = successes / windowEntries.length;
    const failureRate = 1 - successRate;
    return {
      provider,
      healthy: failureRate < this.failureThreshold,
      successRate,
      totalRequests: windowEntries.length,
      windowStart: windowEntries[0]?.timestamp ?? cutoff,
    };
  }
  getAllStatuses() {
    const result = new Map();
    for (const provider of this.entries.keys()) {
      result.set(provider, this.getStatus(provider));
    }
    return result;
  }
  reset(provider) {
    if (provider) {
      this.entries.delete(provider);
    } else {
      this.entries.clear();
    }
  }
}
//# sourceMappingURL=health-tracker.js.map
