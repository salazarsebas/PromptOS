import { readFile } from 'node:fs/promises';

export async function processFile(path: string) {
  const content = await readFile(path, 'utf-8');
  return content.split('\n').length;
}

export function add(a: number, b: number): number {
  return a + b;
}
