import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const CONFIG_FILENAME = '.promptosrc.json';
export async function loadConfig(startDir, explicitPath) {
  if (explicitPath) {
    return readConfigFile(resolve(explicitPath));
  }
  const configPath = await findConfigFile(startDir);
  if (!configPath) {
    return {};
  }
  return readConfigFile(configPath);
}
async function findConfigFile(startDir) {
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
async function readConfigFile(filePath) {
  const raw = await readFile(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  validateConfig(parsed, filePath);
  return parsed;
}
function validateConfig(value, filePath) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid config file: ${filePath} — must be a JSON object`);
  }
  const obj = value;
  const numberFields = [
    'callsPerMonth',
    'avgInputTokens',
    'avgOutputTokens',
    'promptTokenThreshold',
  ];
  for (const field of numberFields) {
    if (!isOptionalPositiveNumber(obj[field])) {
      throw new Error(`Invalid config file: ${filePath} — "${field}" must be a positive number`);
    }
  }
  if (!isOptionalType(obj.deep, 'boolean')) {
    throw new Error(`Invalid config file: ${filePath} — "deep" must be a boolean`);
  }
  if (!isOptionalFormat(obj.format)) {
    throw new Error(
      `Invalid config file: ${filePath} — "format" must be one of: terminal, json, markdown, html`,
    );
  }
  if (!isOptionalStringArray(obj.exclude)) {
    throw new Error(`Invalid config file: ${filePath} — "exclude" must be an array of strings`);
  }
}
function isOptionalType(value, type) {
  return value === undefined || typeof value === type;
}
function isOptionalPositiveNumber(value) {
  if (value === undefined) return true;
  return typeof value === 'number' && value > 0 && Number.isFinite(value);
}
const VALID_CONFIG_FORMATS = new Set(['terminal', 'json', 'markdown', 'html']);
function isOptionalFormat(value) {
  return value === undefined || (typeof value === 'string' && VALID_CONFIG_FORMATS.has(value));
}
function isOptionalStringArray(value) {
  if (value === undefined) return true;
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
//# sourceMappingURL=loader.js.map
