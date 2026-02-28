export function createProxy(target, pipeline, isCreateMethod, createInterceptedMethod, path = []) {
  if (typeof target !== 'object' || target === null) return target;
  return new Proxy(target, {
    get(obj, prop) {
      if (typeof prop === 'symbol') return Reflect.get(obj, prop);
      const value = Reflect.get(obj, prop);
      const currentPath = [...path, prop];
      if (isCreateMethod(currentPath) && typeof value === 'function') {
        return createInterceptedMethod(pipeline, value.bind(obj));
      }
      if (typeof value === 'object' && value !== null) {
        return createProxy(value, pipeline, isCreateMethod, createInterceptedMethod, currentPath);
      }
      if (typeof value === 'function') {
        return value.bind(obj);
      }
      return value;
    },
  });
}
//# sourceMappingURL=create-proxy.js.map
