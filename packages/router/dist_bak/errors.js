import { PromptOSError } from '@promptos/sdk';
export class RouterError extends PromptOSError {
  constructor(message) {
    super(message);
    this.name = 'RouterError';
  }
}
export class NoProvidersConfiguredError extends RouterError {
  constructor() {
    super('No providers configured. Provide at least one provider with an API key.');
    this.name = 'NoProvidersConfiguredError';
  }
}
export class AllProvidersFailedError extends RouterError {
  attempts;
  routingAttempts;
  constructor(attempts, routingAttempts = []) {
    const summary = attempts.map((a) => `${a.provider}: ${a.error}`).join('; ');
    super(`All providers failed: ${summary}`);
    this.name = 'AllProvidersFailedError';
    this.attempts = attempts;
    this.routingAttempts = routingAttempts;
  }
}
//# sourceMappingURL=errors.js.map
