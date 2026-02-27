import { createClient } from '@promptos/sdk';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Set OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Create a client with caching, compression, and budget enforcement
const client = await createClient({
  provider: 'openai',
  apiKey,
  cache: { enabled: true, ttlMs: 60_000, maxEntries: 50 },
  compression: { enabled: true, strategy: 'sentence' },
  tokenBudget: { maxInputTokens: 4000 },
});

const messages = [{ role: 'user' as const, content: 'Explain what a binary search tree is.' }];

// First request — cache miss, hits the API
console.log('Request 1 (cache miss)...');
const start1 = performance.now();
const result1 = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages,
});
const elapsed1 = (performance.now() - start1).toFixed(0);
console.log(`  Response received in ${elapsed1}ms`);
console.log(`  Content: ${JSON.stringify(result1).slice(0, 120)}...\n`);

// Second request — identical, should be a cache hit
console.log('Request 2 (cache hit)...');
const start2 = performance.now();
const result2 = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages,
});
const elapsed2 = (performance.now() - start2).toFixed(0);
console.log(`  Response received in ${elapsed2}ms (should be much faster)`);
console.log(`  Content: ${JSON.stringify(result2).slice(0, 120)}...\n`);

// Budget enforcement — try exceeding the token limit
console.log('Request 3 (budget enforcement)...');
try {
  const longContent = 'Explain in extreme detail: '.concat('a]'.repeat(10_000));
  await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: longContent }],
  });
  console.log('  Request succeeded (within budget)');
} catch (err) {
  console.log(`  Budget enforced: ${err instanceof Error ? err.message : err}`);
}
