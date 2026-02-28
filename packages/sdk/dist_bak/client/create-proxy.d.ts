import type { MiddlewareNext } from '@promptos/shared';
export declare function createProxy(
  target: unknown,
  pipeline: MiddlewareNext,
  isCreateMethod: (path: string[]) => boolean,
  createInterceptedMethod: (
    pipeline: MiddlewareNext,
    originalMethod: (...args: unknown[]) => unknown,
  ) => (...args: unknown[]) => Promise<unknown>,
  path?: string[],
): unknown;
//# sourceMappingURL=create-proxy.d.ts.map
