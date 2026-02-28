export declare class PromptOSError extends Error {
  constructor(message: string);
}
export declare class ProviderNotInstalledError extends PromptOSError {
  constructor(provider: string, packageName: string);
}
export declare class TokenBudgetExceededError extends PromptOSError {
  readonly tokenCount: number;
  readonly maxTokens: number;
  constructor(tokenCount: number, maxTokens: number);
}
//# sourceMappingURL=errors.d.ts.map
