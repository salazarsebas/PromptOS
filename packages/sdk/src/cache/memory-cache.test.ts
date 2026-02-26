import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryCache } from './memory-cache.js';

describe('MemoryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves values', () => {
    const cache = new MemoryCache<string>();
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns undefined for missing keys', () => {
    const cache = new MemoryCache<string>();
    expect(cache.get('missing')).toBeUndefined();
  });

  it('expires entries after TTL', () => {
    const cache = new MemoryCache<string>(1000);
    cache.set('key1', 'value1');

    vi.advanceTimersByTime(999);
    expect(cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(2);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('evicts oldest entry when maxEntries exceeded', () => {
    const cache = new MemoryCache<string>(300_000, 2);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3');

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe('2');
    expect(cache.get('c')).toBe('3');
    expect(cache.size).toBe(2);
  });

  it('moves accessed entries to end (LRU)', () => {
    const cache = new MemoryCache<string>(300_000, 2);
    cache.set('a', '1');
    cache.set('b', '2');

    // Access 'a' to move it to end
    cache.get('a');

    // Add 'c' — should evict 'b' (now oldest), not 'a'
    cache.set('c', '3');

    expect(cache.get('a')).toBe('1');
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe('3');
  });

  it('deletes entries', () => {
    const cache = new MemoryCache<string>();
    cache.set('key1', 'value1');
    expect(cache.delete('key1')).toBe(true);
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.delete('key1')).toBe(false);
  });

  it('clears all entries', () => {
    const cache = new MemoryCache<string>();
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('updates existing key without increasing size', () => {
    const cache = new MemoryCache<string>(300_000, 2);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('a', 'updated');

    expect(cache.size).toBe(2);
    expect(cache.get('a')).toBe('updated');
  });
});
