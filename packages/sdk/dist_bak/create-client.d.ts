import type { SdkClientConfig } from '@promptos/shared';
export interface PromptOSOpenAIClient {
  chat: {
    completions: {
      create: (params: Record<string, unknown>) => Promise<unknown>;
    };
  };
}
export interface PromptOSAnthropicClient {
  messages: {
    create: (params: Record<string, unknown>) => Promise<unknown>;
  };
}
export declare function createClient(
  config: SdkClientConfig & {
    provider: 'openai';
  },
): Promise<PromptOSOpenAIClient>;
export declare function createClient(
  config: SdkClientConfig & {
    provider: 'anthropic';
  },
): Promise<PromptOSAnthropicClient>;
export declare function createClient(
  config: SdkClientConfig,
): Promise<PromptOSOpenAIClient | PromptOSAnthropicClient>;
//# sourceMappingURL=create-client.d.ts.map
