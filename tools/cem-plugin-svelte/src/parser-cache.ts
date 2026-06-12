import { normalize } from "node:path";

import type { AST } from "svelte/compiler";
import type { SvelteCompiledToTsx } from "svelte2tsx";

export type ParserCacheEntry = {
  svelte: AST.Root;
  tsx: SvelteCompiledToTsx;
};

export class ParserCache {
  private cache = new Map<string, ParserCacheEntry>();

  store(path: string, result: ParserCacheEntry) {
    const normalizedPath = normalize(path);

    this.cache.set(normalizedPath, result);
  }

  get(path: string) {
    const normalizedPath = normalize(path);
    const value = this.cache.get(normalizedPath);

    if (!value) {
      throw new Error(`\`${path}\` is not in the cache`);
    }

    return value;
  }
}
