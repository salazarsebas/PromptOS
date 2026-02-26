import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from './loader.js';

describe('loadConfig', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `promptos-config-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns empty config when no file found', async () => {
    const config = await loadConfig(tempDir);
    expect(config).toEqual({});
  });

  it('loads config from current directory', async () => {
    const configData = { callsPerMonth: 5000, deep: true };
    await writeFile(join(tempDir, '.promptosrc.json'), JSON.stringify(configData));

    const config = await loadConfig(tempDir);
    expect(config).toEqual(configData);
  });

  it('walks up parent directories to find config', async () => {
    const childDir = join(tempDir, 'a', 'b', 'c');
    await mkdir(childDir, { recursive: true });
    const configData = { avgInputTokens: 1000 };
    await writeFile(join(tempDir, '.promptosrc.json'), JSON.stringify(configData));

    const config = await loadConfig(childDir);
    expect(config).toEqual(configData);
  });

  it('loads from explicit path', async () => {
    const configPath = join(tempDir, 'custom-config.json');
    const configData = { format: 'json', exclude: ['vendor/**'] };
    await writeFile(configPath, JSON.stringify(configData));

    const config = await loadConfig(tempDir, configPath);
    expect(config).toEqual(configData);
  });

  it('throws on invalid JSON', async () => {
    const configPath = join(tempDir, '.promptosrc.json');
    await writeFile(configPath, 'not json');

    await expect(loadConfig(tempDir)).rejects.toThrow();
  });

  it('throws on invalid config shape with field name', async () => {
    const configPath = join(tempDir, '.promptosrc.json');
    await writeFile(configPath, JSON.stringify({ callsPerMonth: 'not a number' }));

    await expect(loadConfig(tempDir)).rejects.toThrow('"callsPerMonth" must be a positive number');
  });

  it('rejects negative numeric values', async () => {
    await writeFile(join(tempDir, '.promptosrc.json'), JSON.stringify({ callsPerMonth: -100 }));
    await expect(loadConfig(tempDir)).rejects.toThrow('Invalid config file');
  });

  it('rejects zero for numeric values', async () => {
    await writeFile(join(tempDir, '.promptosrc.json'), JSON.stringify({ avgInputTokens: 0 }));
    await expect(loadConfig(tempDir)).rejects.toThrow('Invalid config file');
  });

  it('rejects non-finite numeric values', async () => {
    await writeFile(join(tempDir, '.promptosrc.json'), JSON.stringify({ callsPerMonth: null }));
    await expect(loadConfig(tempDir)).rejects.toThrow('Invalid config file');
  });

  it('accepts valid optional fields', async () => {
    const configData = {
      callsPerMonth: 2000,
      avgInputTokens: 300,
      avgOutputTokens: 100,
      format: 'markdown',
      deep: true,
      promptTokenThreshold: 3000,
      exclude: ['vendor/**', 'generated/**'],
    };
    await writeFile(join(tempDir, '.promptosrc.json'), JSON.stringify(configData));

    const config = await loadConfig(tempDir);
    expect(config).toEqual(configData);
  });
});
