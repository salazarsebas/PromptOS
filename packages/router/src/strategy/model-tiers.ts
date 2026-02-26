import type {
  ComplexityLevel,
  ModelIdentifier,
  RouterProvider,
  RoutingStrategy,
} from '../types.js';

type TierTable = Record<
  RoutingStrategy,
  Record<RouterProvider, Record<ComplexityLevel, ModelIdentifier>>
>;

const MODEL_TIERS: TierTable = {
  'cost-optimized': {
    openai: { simple: 'gpt-4o-mini', moderate: 'gpt-4o-mini', complex: 'gpt-4o' },
    anthropic: {
      simple: 'claude-haiku-4-5',
      moderate: 'claude-haiku-4-5',
      complex: 'claude-sonnet-4-5',
    },
  },
  'quality-first': {
    openai: { simple: 'gpt-4o', moderate: 'gpt-4o', complex: 'gpt-4o' },
    anthropic: {
      simple: 'claude-sonnet-4-5',
      moderate: 'claude-sonnet-4-5',
      complex: 'claude-sonnet-4-5',
    },
  },
  balanced: {
    openai: { simple: 'gpt-4o-mini', moderate: 'gpt-4o', complex: 'gpt-4o' },
    anthropic: {
      simple: 'claude-haiku-4-5',
      moderate: 'claude-sonnet-4-5',
      complex: 'claude-sonnet-4-5',
    },
  },
};

export function getModelForTier(
  strategy: RoutingStrategy,
  provider: RouterProvider,
  complexity: ComplexityLevel,
): ModelIdentifier {
  return MODEL_TIERS[strategy][provider][complexity];
}
