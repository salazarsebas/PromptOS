export function compose(middlewares) {
  return function execute(initialCtx) {
    let index = -1;
    let currentCtx = initialCtx;
    function dispatch(i, nextCtx) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;
      currentCtx = nextCtx;
      const middleware = middlewares[i];
      if (!middleware) {
        return Promise.reject(new Error('Pipeline reached end without producing a result'));
      }
      return middleware(currentCtx, (ctx) => dispatch(i + 1, ctx));
    }
    return dispatch(0, initialCtx);
  };
}
//# sourceMappingURL=pipeline.js.map
