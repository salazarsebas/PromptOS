import { PromptOSError } from '@promptos/sdk';
import type { RoutingAttempt } from './types.js';

export class RouterError extends PromptOSError {
  constructor(message: string) {
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
  readonly attempts: Array<{ provider: string; error: string }>;
  readonly routingAttempts: RoutingAttempt[];

  constructor(
    attempts: Array<{ provider: string; error: string }>,
    routingAttempts: RoutingAttempt[] = [],
  ) {
    const summary = attempts.map((a) => `${a.provider}: ${a.error}`).join('; ');
    super(`All providers failed: ${summary}`);
    this.name = 'AllProvidersFailedError';
    this.attempts = attempts;
    this.routingAttempts = routingAttempts;
  }
}
