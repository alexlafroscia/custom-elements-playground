import { parse, resolve } from "node:path";
import * as fs from "node:fs";

import type { Config } from "@custom-elements-manifest/analyzer";

import type ts from "@cem-analyzer-dep/typescript";
import {
  type SupportedCompilerOptions,
  compileSvelteFile,
} from "./compile-svelte-file.js";

type OverrideModuleCreation = Exclude<
  Config["overrideModuleCreation"],
  undefined
>;

/**
 * 1:1 copy of the CEM analyzer default module parser
 */
function defaultParse(compiler: typeof ts, glob: string, source: string) {
  return compiler.createSourceFile(
    glob,
    source,
    compiler.ScriptTarget.ES2015,
    true,
  );
}

interface OverrideModuleCreationOptions {
  cwd?: string;
  compilerOptions?: SupportedCompilerOptions;
}

/**
 * Creates an `overrideModuleCreation` function for the CEM analyzer that
 * handles parsing `.svelte` files into the format needed by the plugin
 */
export function overrideModuleCreation({
  cwd = process.cwd(),
  compilerOptions = {},
}: OverrideModuleCreationOptions = {}): OverrideModuleCreation {
  return ({ ts, globs }) => {
    return globs.map((glob) => {
      const fullPath = resolve(cwd, glob);
      const parsedPath = parse(glob);

      let source = fs.readFileSync(fullPath).toString();

      if (parsedPath.ext.endsWith("svelte")) {
        source = compileSvelteFile(source, {
          glob,
          cwd,
          compilerOptions,
        });
      }

      return defaultParse(ts, glob, source);
    });
  };
}
