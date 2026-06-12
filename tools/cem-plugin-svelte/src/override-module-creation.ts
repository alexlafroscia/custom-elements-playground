import * as fs from "node:fs";
import { normalize, parse, resolve } from "node:path";

import type { Config } from "@custom-elements-manifest/analyzer";

import { compileSvelteFile } from "./compile-svelte-file.js";
import type { SveltePluginState } from "./state.js";

export type OverrideModuleCreation = Exclude<Config["overrideModuleCreation"], undefined>;

export function createOverrideModuleCreation(state: SveltePluginState): OverrideModuleCreation {
  return ({ ts, globs }) => {
    // Map absolute .svelte.tsx virtual path → tsx content for the typed program
    const virtualFiles = new Map<string, string>();

    const sourceFiles = globs.map((glob) => {
      const fullPath = resolve(state.cwd, glob);
      let source = fs.readFileSync(fullPath).toString();

      if (parse(glob).ext.endsWith("svelte")) {
        source = compileSvelteFile(source, state, { glob });
        // Use .svelte.tsx so TypeScript recognises it as a TSX file
        virtualFiles.set(normalize(fullPath + ".tsx"), source);
      }

      // Return with the original relative path so CEM can match it back to the file
      return ts.createSourceFile(glob, source, ts.ScriptTarget.ES2015, true);
    });

    // Build a separate typed program so we can resolve types across files
    const host = ts.createCompilerHost({});
    const realGetSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (filename, langVersion) => {
      const tsxCode = virtualFiles.get(normalize(filename));
      if (tsxCode) return ts.createSourceFile(filename, tsxCode, langVersion, true);
      return realGetSourceFile(filename, langVersion);
    };

    const rootNames = globs
      .filter((g) => parse(g).ext.endsWith("svelte"))
      .map((g) => resolve(state.cwd, g) + ".tsx");

    const program = ts.createProgram(rootNames, { strict: false }, host);
    state.program = program;
    state.checker = program.getTypeChecker();

    return sourceFiles;
  };
}
