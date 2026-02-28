import { MemoryCache } from '@prompt-os/sdk';

const ITERATIONS = 100_000;

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function runBench(label: string, fn: () => void): number[] {
  const times: number[] = [];
  // Warmup
  for (let i = 0; i < 1000; i++) fn();

  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    fn();
    times.push((performance.now() - start) * 1000); // microseconds
  }
  times.sort((a, b) => a - b);

  console.log(`  ${label}:`);
  console.log(`    p50: ${percentile(times, 50).toFixed(2)} µs`);
  console.log(`    p95: ${percentile(times, 95).toFixed(2)} µs`);
  console.log(`    p99: ${percentile(times, 99).toFixed(2)} µs`);
  return times;
}

console.log(`\nMemoryCache Latency Benchmark (${ITERATIONS.toLocaleString()} iterations)\n`);

const cache = new MemoryCache<string>(300_000, 1000);

// Pre-populate cache for hit benchmark
for (let i = 0; i < 1000; i++) {
  cache.set(`key-${i}`, `value-${i}`);
}

// Cache hit
runBench('cache.get (hit)', () => {
  cache.get('key-500');
});

// Cache miss
runBench('cache.get (miss)', () => {
  cache.get('nonexistent-key');
});

// Cache set (existing key)
runBench('cache.set (update)', () => {
  cache.set('key-500', 'updated-value');
});

// Cache set (new key, triggers eviction at capacity)
let counter = 2000;
runBench('cache.set (new + eviction)', () => {
  cache.set(`bench-${counter++}`, 'value');
});

console.log('\nDone.');
