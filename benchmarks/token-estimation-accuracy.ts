import { estimateTokens, estimateTokensFast } from '@promptos/shared';

interface TestCase {
  label: string;
  text: string;
}

const testCases: TestCase[] = [
  {
    label: 'English prose',
    text: 'The quick brown fox jumps over the lazy dog. This is a simple sentence used for testing tokenization accuracy across different estimation methods. It contains common English words and punctuation.',
  },
  {
    label: 'Source code',
    text: `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
const result = fibonacci(10);
console.log(\`Fibonacci(10) = \${result}\`);`,
  },
  {
    label: 'Unicode / CJK',
    text: 'こんにちは世界。これはトークン化のテストです。日本語のテキストは英語とは異なるトークン数になります。',
  },
  {
    label: 'JSON data',
    text: JSON.stringify({
      users: [
        {
          id: 1,
          name: 'Alice',
          email: 'alice@example.com',
          roles: ['admin', 'user'],
        },
        {
          id: 2,
          name: 'Bob',
          email: 'bob@example.com',
          roles: ['user'],
        },
      ],
      metadata: { total: 2, page: 1 },
    }),
  },
  {
    label: 'Mixed content',
    text: '# API Reference\n\nEndpoint: `POST /api/v1/chat`\n\n```json\n{"model": "gpt-4o", "messages": [{"role": "user", "content": "Hello 世界"}]}\n```\n\nReturns a `200 OK` with the completion.',
  },
];

console.log('\nToken Estimation Accuracy Benchmark\n');
console.log('| Text Type | Chars | estimateTokens | estimateTokensFast | Delta |');
console.log('|-----------|-------|----------------|--------------------|-------|');

for (const { label, text } of testCases) {
  const accurate = estimateTokens(text);
  const fast = estimateTokensFast(text.length);
  const delta = ((Math.abs(accurate - fast) / accurate) * 100).toFixed(1);
  console.log(
    `| ${label.padEnd(15)} | ${String(text.length).padStart(5)} | ${String(accurate).padStart(14)} | ${String(fast).padStart(18)} | ${delta.padStart(4)}% |`,
  );
}

// Speed comparison
console.log('\nSpeed Comparison\n');

const longText = 'The quick brown fox jumps over the lazy dog. '.repeat(1000);
const iterations = 10_000;

// estimateTokens speed
let start = performance.now();
for (let i = 0; i < iterations; i++) estimateTokens(longText);
const accurateMs = performance.now() - start;

// estimateTokensFast speed
start = performance.now();
for (let i = 0; i < iterations; i++) estimateTokensFast(longText.length);
const fastMs = performance.now() - start;

console.log(
  `estimateTokens:     ${(iterations / (accurateMs / 1000)).toFixed(0)} ops/sec (${(accurateMs / iterations).toFixed(3)} ms/op)`,
);
console.log(
  `estimateTokensFast: ${(iterations / (fastMs / 1000)).toFixed(0)} ops/sec (${(fastMs / iterations).toFixed(3)} ms/op)`,
);
console.log(`Speedup: ${(accurateMs / fastMs).toFixed(1)}x faster with estimateTokensFast`);

console.log('\nDone.');
