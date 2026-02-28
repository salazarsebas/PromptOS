import { classifyComplexity, createRouter } from '@prompt-os/router';
import type { NormalizedMessage } from '@prompt-os/shared';

const openaiKey = process.env.OPENAI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

if (!openaiKey || !anthropicKey) {
  console.error('Set both OPENAI_API_KEY and ANTHROPIC_API_KEY environment variables');
  process.exit(1);
}

const router = createRouter({
  providers: {
    openai: { apiKey: openaiKey },
    anthropic: { apiKey: anthropicKey },
  },
  routing: {
    strategy: 'balanced',
    fallbackChain: ['openai', 'anthropic'],
  },
  healthCheck: {
    windowSizeMs: 60_000,
    failureThreshold: 3,
  },
});

// --- Simple request (should route to a smaller model) ---
console.log('=== Simple Request ===\n');
const simpleMessages: NormalizedMessage[] = [
  { role: 'user', content: "Translate 'hello' to Spanish." },
];

const simpleComplexity = classifyComplexity(simpleMessages);
console.log(
  `Complexity: ${simpleComplexity.level} (confidence: ${simpleComplexity.confidence.toFixed(2)})`,
);

const simpleResponse = await router.complete({ messages: simpleMessages });
console.log(`Provider: ${simpleResponse.provider}`);
console.log(`Model: ${simpleResponse.routing.selectedModel}`);
console.log(`Content: ${simpleResponse.content.slice(0, 200)}`);
console.log(`Latency: ${simpleResponse.routing.totalLatencyMs}ms\n`);

// --- Complex request (should route to a larger model) ---
console.log('=== Complex Request ===\n');
const complexMessages: NormalizedMessage[] = [
  {
    role: 'system',
    content: 'You are a senior software architect. Provide comprehensive, detailed analysis.',
  },
  {
    role: 'user',
    content:
      'Compare microservices vs monolith architectures. Analyze trade-offs for a team of 5 engineers building an e-commerce platform. Include step-by-step migration strategy, code review considerations, and debugging approach.',
  },
];

const complexComplexity = classifyComplexity(complexMessages);
console.log(
  `Complexity: ${complexComplexity.level} (confidence: ${complexComplexity.confidence.toFixed(2)})`,
);

const complexResponse = await router.complete({ messages: complexMessages });
console.log(`Provider: ${complexResponse.provider}`);
console.log(`Model: ${complexResponse.routing.selectedModel}`);
console.log(`Content: ${complexResponse.content.slice(0, 300)}...`);
console.log(`Latency: ${complexResponse.routing.totalLatencyMs}ms\n`);

// --- Health status ---
console.log('=== Provider Health ===\n');
for (const provider of ['openai', 'anthropic'] as const) {
  const status = router.getHealthStatus(provider);
  console.log(
    `${status.provider}: ${status.healthy ? 'healthy' : 'unhealthy'} (${status.totalRequests} requests, ${(status.successRate * 100).toFixed(0)}% success)`,
  );
}
