import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@prompt-os/shared': resolve(dir, '../shared/src/index.ts'),
      '@prompt-os/sdk': resolve(dir, '../sdk/src/index.ts'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
