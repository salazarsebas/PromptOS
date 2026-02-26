import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { PromptOSConfig } from '@promptos/shared';

const CONFIG_FILENAME = '.promptosrc.json';

export async function loadConfig(startDir: string, explicitPath?: string): Promise<PromptOSConfig> {
  if (explicitPath) {
    return readConfigFile(resolve(explicitPath));
  }

  const configPath = await findConfigFile(startDir);
  if (!configPath) {
    return {};
  }

  return readConfigFile(configPath);
}

async function findConfigFile(startDir: string): Promise<string | null> {
  let current = resolve(startDir);

  for (;;) {
    const candidate = join(current, CONFIG_FILENAME);
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Not found at this level, try parent
    }

    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

async function readConfigFile(filePath: string): Promise<PromptOSConfig> {
  const raw = await readFile(filePath, 'utf-8');
  const parsed: unknown = JSON.parse(raw);

  if (!isValidConfig(parsed)) {
    throw new Error(`Invalid config file: ${filePath}`);
  }

  return parsed;
}

function isValidConfig(value: unknown): value is PromptOSConfig {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    isOptionalPositiveNumber(obj.callsPerMonth) &&
    isOptionalPositiveNumber(obj.avgInputTokens) &&
    isOptionalPositiveNumber(obj.avgOutputTokens) &&
    isOptionalPositiveNumber(obj.promptTokenThreshold) &&
    isOptionalType(obj.deep, 'boolean') &&
    isOptionalFormat(obj.format) &&
    isOptionalStringArray(obj.exclude)
  );
}

function isOptionalType(value: unknown, type: string): boolean {
  return value === undefined || typeof value === type;
}

function isOptionalPositiveNumber(value: unknown): boolean {
  if (value === undefined) return true;
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}

const VALID_CONFIG_FORMATS = new Set(['terminal', 'json', 'markdown', 'html']);

function isOptionalFormat(value: unknown): boolean {
  return value === undefined || (typeof value === 'string' && VALID_CONFIG_FORMATS.has(value));
}

function isOptionalStringArray(value: unknown): boolean {
  if (value === undefined) return true;
  return Array.isArray(value) && value.every((item: unknown) => typeof item === 'string');
}
