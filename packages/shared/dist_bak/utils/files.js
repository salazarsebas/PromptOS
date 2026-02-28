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
  dirPath,
  extensions = SCANNABLE_EXTENSIONS,
  ignoreDirs = IGNORED_DIRS,
) {
  const results = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      // Skip directories that can't be read (EACCES, ELOOP, ENOENT, etc.)
      return;
    }
    const promises = [];
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
//# sourceMappingURL=files.js.map
