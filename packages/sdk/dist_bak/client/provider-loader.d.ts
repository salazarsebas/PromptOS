export declare function loadOpenAIClient(options: { apiKey: string; baseURL?: string }): Promise<{
  chat: {
    completions: {
      create: (params: Record<string, unknown>) => Promise<unknown>;
    };
  };
}>;
export declare function loadAnthropicClient(options: {
  apiKey: string;
  baseURL?: string;
}): Promise<{
  messages: {
    create: (params: Record<string, unknown>) => Promise<unknown>;
  };
}>;
//# sourceMappingURL=provider-loader.d.ts.map
