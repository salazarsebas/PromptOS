import { compressMessages } from '@prompt-os/sdk';
import type { CompressionStrategy, NormalizedMessage } from '@prompt-os/shared';

function generateMessages(targetTokens: number): NormalizedMessage[] {
  // ~4 chars per token
  const content = 'The quick brown fox jumps over the lazy dog. '.repeat(
    Math.ceil((targetTokens * 4) / 46),
  );
  return [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content },
  ];
}

function bench(
  label: string,
  messages: NormalizedMessage[],
  maxTokens: number,
  strategy: CompressionStrategy,
  iterations: number,
): void {
  // Warmup
  for (let i = 0; i < 10; i++) compressMessages(messages, maxTokens, strategy);

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    compressMessages(messages, maxTokens, strategy);
  }
  const elapsed = performance.now() - start;
  const opsPerSec = ((iterations / elapsed) * 1000).toFixed(0);

  console.log(`  ${label}: ${opsPerSec} ops/sec (${(elapsed / iterations).toFixed(2)} ms/op)`);
}

console.log('\nCompression Throughput Benchmark\n');

const sizes = [100, 500, 1000, 5000, 10000];
const strategies: CompressionStrategy[] = ['trim', 'sentence'];

for (const strategy of strategies) {
  console.log(`Strategy: ${strategy}`);
  for (const size of sizes) {
    const messages = generateMessages(size);
    const maxTokens = Math.floor(size * 0.5); // compress to 50%
    const iterations = size > 5000 ? 100 : 1000;
    bench(`  ${size} tokens -> ${maxTokens}`, messages, maxTokens, strategy, iterations);
  }
  console.log();
}

console.log('Done.');
