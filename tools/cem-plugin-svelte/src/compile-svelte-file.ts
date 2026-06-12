import { type CompileOptions, parse } from "svelte/compiler";
import { svelte2tsx } from "svelte2tsx";

import type { SveltePluginState } from "./state.js";

export type SupportedCompilerOptions = Omit<
  CompileOptions,
  "filename" | "format" | "generate"
>;

interface CompileSvelteFileOptions {
  glob: string;
}

export function compileSvelteFile(
  source: string,
  state: SveltePluginState,
  options: CompileSvelteFileOptions,
): string {
  const { glob } = options;

  const svelteCompilerOutput = parse(source, {
    filename: glob,
    modern: true,
  });

  const tsxCompilerOutput = svelte2tsx(source, {
    filename: glob,
    isTsFile: true,
  });

  // Cache compiler result for the plugin to access
  state.parserCache.store(glob, {
    svelte: svelteCompilerOutput,
    tsx: tsxCompilerOutput,
  });

  // Use the `tsx` representation to represent the file
  // We already have the AST for the Svelte compiler, and returning the
  // `tsx` version will let CEM Analyzer give us the AST for the type defs
  return tsxCompilerOutput.code;
}
