import type tsModule from "@cem-analyzer-dep/typescript";

import type { SupportedCompilerOptions } from "./compile-svelte-file.js";
import type { ParserCache } from "./parser-cache.js";

export interface SveltePluginState {
  compilerOptions: SupportedCompilerOptions;
  cwd: string;
  tsconfigPath?: string;
  parserCache: ParserCache;

  checker?: tsModule.TypeChecker;
  program?: tsModule.Program;
}
