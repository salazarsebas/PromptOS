import type {
  Middleware,
  MiddlewareContext,
  MiddlewareNext,
  MiddlewareResult,
} from '@prompt-os/shared';

export function compose(middlewares: Middleware[]): MiddlewareNext {
  return function execute(initialCtx: MiddlewareContext): Promise<MiddlewareResult> {
    let index = -1;
    let currentCtx = initialCtx;

    function dispatch(i: number, nextCtx: MiddlewareContext): Promise<MiddlewareResult> {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;
      currentCtx = nextCtx;

      const middleware = middlewares[i];
      if (!middleware) {
        return Promise.reject(new Error('Pipeline reached end without producing a result'));
      }

      return middleware(currentCtx, (ctx: MiddlewareContext) => dispatch(i + 1, ctx));
    }

    return dispatch(0, initialCtx);
  };
}
