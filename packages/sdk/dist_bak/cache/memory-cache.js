export class MemoryCache {
  store = new Map();
  ttlMs;
  maxEntries;
  constructor(ttlMs = 300_000, maxEntries = 100) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // Move to end for LRU
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }
  set(key, value) {
    // Delete first to update insertion order
    this.store.delete(key);
    // Evict oldest if at capacity
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
  delete(key) {
    return this.store.delete(key);
  }
  get size() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
}
//# sourceMappingURL=memory-cache.js.map
