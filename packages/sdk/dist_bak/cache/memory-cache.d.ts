export declare class MemoryCache<T> {
  private readonly store;
  private readonly ttlMs;
  private readonly maxEntries;
  constructor(ttlMs?: number, maxEntries?: number);
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): boolean;
  get size(): number;
  clear(): void;
}
//# sourceMappingURL=memory-cache.d.ts.map
