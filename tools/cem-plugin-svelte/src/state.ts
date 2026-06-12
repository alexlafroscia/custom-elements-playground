import type tsModule from "@cem-analyzer-dep/typescript";

import type { ParserCache } from "./parser-cache.js";
import type { SupportedCompilerOptions } from "./compile-svelte-file.js";

export interface SveltePluginState {
  compilerOptions: SupportedCompilerOptions;
  cwd: string;
  parserCache: ParserCache;

  checker?: tsModule.TypeChecker;
  program?: tsModule.Program;
}
