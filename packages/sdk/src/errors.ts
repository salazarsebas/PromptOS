export class PromptOSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromptOSError';
  }
}

export class ProviderNotInstalledError extends PromptOSError {
  constructor(provider: string, packageName: string) {
    super(
      `Provider "${provider}" requires the "${packageName}" package. Install it with: bun add ${packageName}`,
    );
    this.name = 'ProviderNotInstalledError';
  }
}

export class TokenBudgetExceededError extends PromptOSError {
  readonly tokenCount: number;
  readonly maxTokens: number;

  constructor(tokenCount: number, maxTokens: number) {
    super(
      `Token budget exceeded: ${tokenCount} tokens (max: ${maxTokens}). Enable compression or increase the budget.`,
    );
    this.name = 'TokenBudgetExceededError';
    this.tokenCount = tokenCount;
    this.maxTokens = maxTokens;
  }
}
