import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const SCANNABLE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
  '.py',
]);

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  '.turbo',
  '.cache',
  '__pycache__',
  '.venv',
  'venv',
]);

export async function collectFiles(
  dirPath: string,
  extensions: Set<string> = SCANNABLE_EXTENSIONS,
  ignoreDirs: Set<string> = IGNORED_DIRS,
): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    const promises: Promise<void>[] = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) {
          promises.push(walk(fullPath));
        }
      } else if (entry.isFile() && extensions.has(extname(entry.name))) {
        results.push(fullPath);
      }
    }

    await Promise.all(promises);
  }

  await walk(dirPath);
  return results;
}
