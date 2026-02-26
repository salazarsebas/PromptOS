import { Router } from './router.js';
import type { RouterConfig } from './types.js';

export function createRouter(config: RouterConfig): Router {
  return new Router(config);
}
