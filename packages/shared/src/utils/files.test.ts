import { chmod, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { collectFiles } from './files.js';

let testDir: string;

beforeEach(async () => {
  testDir = join(tmpdir(), `promptos-test-${Date.now()}`);
  await mkdir(testDir, { recursive: true });
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe('collectFiles', () => {
  it('collects .ts and .js files', async () => {
    await writeFile(join(testDir, 'app.ts'), 'export const x = 1;');
    await writeFile(join(testDir, 'util.js'), 'module.exports = {};');
    await writeFile(join(testDir, 'style.css'), 'body {}');

    const files = await collectFiles(testDir);
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.endsWith('app.ts'))).toBe(true);
    expect(files.some((f) => f.endsWith('util.js'))).toBe(true);
  });

  it('ignores node_modules directory', async () => {
    await mkdir(join(testDir, 'node_modules'), { recursive: true });
    await writeFile(join(testDir, 'node_modules', 'lib.ts'), 'export {};');
    await writeFile(join(testDir, 'app.ts'), 'export {};');

    const files = await collectFiles(testDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('app.ts');
  });

  it('walks nested directories', async () => {
    await mkdir(join(testDir, 'src', 'utils'), { recursive: true });
    await writeFile(join(testDir, 'src', 'index.ts'), 'export {};');
    await writeFile(join(testDir, 'src', 'utils', 'helper.ts'), 'export {};');

    const files = await collectFiles(testDir);
    expect(files).toHaveLength(2);
  });

  it('returns empty array for empty directory', async () => {
    const files = await collectFiles(testDir);
    expect(files).toEqual([]);
  });

  it('collects Python files', async () => {
    await writeFile(join(testDir, 'main.py'), 'print("hello")');

    const files = await collectFiles(testDir);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('main.py');
  });

  it('skips unreadable directories without crashing', async () => {
    await mkdir(join(testDir, 'readable'), { recursive: true });
    await writeFile(join(testDir, 'readable', 'good.ts'), 'export {};');
    await mkdir(join(testDir, 'restricted'), { recursive: true });
    await writeFile(join(testDir, 'restricted', 'hidden.ts'), 'export {};');
    await chmod(join(testDir, 'restricted'), 0o000);

    const files = await collectFiles(testDir);
    expect(files.some((f) => f.endsWith('good.ts'))).toBe(true);
    expect(files.some((f) => f.endsWith('hidden.ts'))).toBe(false);

    // Restore permissions for cleanup
    await chmod(join(testDir, 'restricted'), 0o755);
  });

  it('handles circular symlinks without crashing', async () => {
    await mkdir(join(testDir, 'dir-a'), { recursive: true });
    await writeFile(join(testDir, 'dir-a', 'file.ts'), 'export {};');
    await symlink(join(testDir, 'dir-a'), join(testDir, 'dir-a', 'loop'));

    const files = await collectFiles(testDir);
    expect(files.some((f) => f.endsWith('file.ts'))).toBe(true);
  });
});
