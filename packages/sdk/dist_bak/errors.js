export class PromptOSError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PromptOSError';
  }
}
export class ProviderNotInstalledError extends PromptOSError {
  constructor(provider, packageName) {
    super(
      `Provider "${provider}" requires the "${packageName}" package. Install it with: bun add ${packageName}`,
    );
    this.name = 'ProviderNotInstalledError';
  }
}
export class TokenBudgetExceededError extends PromptOSError {
  tokenCount;
  maxTokens;
  constructor(tokenCount, maxTokens) {
    super(
      `Token budget exceeded: ${tokenCount} tokens (max: ${maxTokens}). Enable compression or increase the budget.`,
    );
    this.name = 'TokenBudgetExceededError';
    this.tokenCount = tokenCount;
    this.maxTokens = maxTokens;
  }
}
//# sourceMappingURL=errors.js.map
