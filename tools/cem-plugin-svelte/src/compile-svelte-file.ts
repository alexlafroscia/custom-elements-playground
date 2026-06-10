import { type CompileOptions, parse } from "svelte/compiler";
import { svelte2tsx } from "svelte2tsx";

import { storeCompilerResult } from "./parser-cache.js";

export type SupportedCompilerOptions = Omit<
  CompileOptions,
  "filename" | "format" | "generate"
>;

interface CompileSvelteFileOptions {
  glob: string;
  cwd: string;
  compilerOptions?: SupportedCompilerOptions;
}

export function compileSvelteFile(
  source: string,
  options: CompileSvelteFileOptions,
): string {
  const { glob, cwd, compilerOptions = {} } = options;

  const svelteCompilerOutput = parse(source, {
    filename: glob,
    modern: true,
    // ...compilerOptions,
  });

  const tsxCompilerOutput = svelte2tsx(source, {
    filename: glob,
    isTsFile: true,
  });

  // Cache compiler result for the plugin to access
  storeCompilerResult(glob, {
    svelte: svelteCompilerOutput,
    tsx: tsxCompilerOutput,
  });

  // Use the `tsx` representation to represent the file
  // We already have the AST for the Svelte compiler, and returning the
  // `tsx` version will let CEM Analyzer give us the AST for the type defs
  return tsxCompilerOutput.code;
}
