import { PromptOSError } from '@promptos/sdk';
import type { RoutingAttempt } from './types.js';
export declare class RouterError extends PromptOSError {
  constructor(message: string);
}
export declare class NoProvidersConfiguredError extends RouterError {
  constructor();
}
export declare class AllProvidersFailedError extends RouterError {
  readonly attempts: Array<{
    provider: string;
    error: string;
  }>;
  readonly routingAttempts: RoutingAttempt[];
  constructor(
    attempts: Array<{
      provider: string;
      error: string;
    }>,
    routingAttempts?: RoutingAttempt[],
  );
}
//# sourceMappingURL=errors.d.ts.map
