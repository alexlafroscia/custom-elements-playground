import { normalize } from "node:path";
import type { AST } from "svelte/compiler";
import type { SvelteCompiledToTsx } from "svelte2tsx";

export type ParserCacheEntry = {
  svelte: AST.Root;
  tsx: SvelteCompiledToTsx;
};

const PARSER_CACHE = new Map<string, ParserCacheEntry>();

export function storeCompilerResult(path: string, result: ParserCacheEntry) {
  const normalizedPath = normalize(path);

  PARSER_CACHE.set(normalizedPath, result);
}

export function getCompilerResult(path: string) {
  const normalizedPath = normalize(path);
  const value = PARSER_CACHE.get(normalizedPath);

  if (!value) {
    throw new Error(`\`${path}\` is not in the cache`);
  }

  return value;
}

export function reset() {
  PARSER_CACHE.clear();
}
