import type {
  Middleware,
  MiddlewareContext,
  MiddlewareNext,
  MiddlewareResult,
} from '@promptos/shared';

export function compose(middlewares: Middleware[]): MiddlewareNext {
  return function execute(ctx: MiddlewareContext): Promise<MiddlewareResult> {
    let index = -1;

    function dispatch(i: number): Promise<MiddlewareResult> {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;

      const middleware = middlewares[i];
      if (!middleware) {
        return Promise.reject(new Error('Pipeline reached end without producing a result'));
      }

      return middleware(ctx, (_nextCtx: MiddlewareContext) => dispatch(i + 1));
    }

    return dispatch(0);
  };
}
