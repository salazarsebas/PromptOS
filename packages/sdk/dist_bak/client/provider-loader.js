import { ProviderNotInstalledError } from '../errors.js';
export async function loadOpenAIClient(options) {
  let Constructor;
  try {
    const mod = await import('openai');
    Constructor = mod.default ?? mod;
  } catch {
    throw new ProviderNotInstalledError('openai', 'openai');
  }
  return new Constructor(options);
}
export async function loadAnthropicClient(options) {
  let Constructor;
  try {
    const mod = await import('@anthropic-ai/sdk');
    Constructor = mod.default ?? mod;
  } catch {
    throw new ProviderNotInstalledError('anthropic', '@anthropic-ai/sdk');
  }
  return new Constructor(options);
}
//# sourceMappingURL=provider-loader.js.map
