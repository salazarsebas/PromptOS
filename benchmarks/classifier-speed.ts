import { classifyComplexity } from '@prompt-os/router';
import type { NormalizedMessage } from '@prompt-os/shared';

interface BenchCase {
  label: string;
  messages: NormalizedMessage[];
}

const cases: BenchCase[] = [
  {
    label: 'Simple',
    messages: [{ role: 'user', content: "Translate 'hello' to French." }],
  },
  {
    label: 'Moderate',
    messages: [
      { role: 'system', content: 'You are a helpful coding assistant.' },
      {
        role: 'user',
        content:
          'Write a function that sorts an array of objects by a given key. Handle edge cases like null values.',
      },
      {
        role: 'assistant',
        content: "Here's a function that handles the sorting with null handling...",
      },
      {
        role: 'user',
        content: 'Can you also add TypeScript types and make it generic?',
      },
    ],
  },
  {
    label: 'Complex',
    messages: [
      {
        role: 'system',
        content:
          'You are a senior software architect. Provide comprehensive, step-by-step analysis with code review and debugging approach.',
      },
      {
        role: 'user',
        content:
          'Analyze the trade-offs between microservices and monolith architectures for a team of 5 building an e-commerce platform. Compare deployment strategies, explain the debugging approach for distributed traces, provide a step-by-step refactoring plan, and optimize the database query patterns.',
      },
      {
        role: 'assistant',
        content:
          'Let me break this down into several areas of analysis. First, regarding architecture selection for a team of 5...',
      },
      {
        role: 'user',
        content:
          'Now compare this with a serverless approach. Include detailed cost analysis, cold start optimization strategies, and a comprehensive migration path from the monolith.',
      },
    ],
  },
];

const ITERATIONS = 100_000;

console.log(
  `\nComplexity Classifier Speed Benchmark (${ITERATIONS.toLocaleString()} iterations)\n`,
);

for (const { label, messages } of cases) {
  // Verify classification
  const result = classifyComplexity(messages);
  console.log(`${label} -> ${result.level} (confidence: ${result.confidence.toFixed(2)})`);

  // Warmup
  for (let i = 0; i < 1000; i++) classifyComplexity(messages);

  // Benchmark
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    classifyComplexity(messages);
  }
  const elapsed = performance.now() - start;
  const opsPerSec = ((ITERATIONS / elapsed) * 1000).toFixed(0);
  const usPerOp = ((elapsed / ITERATIONS) * 1000).toFixed(2);

  console.log(`  ${opsPerSec} ops/sec | ${usPerOp} µs/op\n`);
}

console.log('Done.');
