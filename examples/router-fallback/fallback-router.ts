import { classifyComplexity, createRouter } from '@promptos/router';
import type { NormalizedMessage } from '@promptos/shared';

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

const simpleResponse = await router.message({ messages: simpleMessages });
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

const complexResponse = await router.message({ messages: complexMessages });
console.log(`Provider: ${complexResponse.provider}`);
console.log(`Model: ${complexResponse.routing.selectedModel}`);
console.log(`Content: ${complexResponse.content.slice(0, 300)}...`);
console.log(`Latency: ${complexResponse.routing.totalLatencyMs}ms\n`);

// --- Health status ---
console.log('=== Provider Health ===\n');
const health = router.getHealthStatus();
for (const status of health) {
  console.log(
    `${status.provider}: ${status.isHealthy ? 'healthy' : 'unhealthy'} (${status.successCount} ok, ${status.failureCount} failures)`,
  );
}
