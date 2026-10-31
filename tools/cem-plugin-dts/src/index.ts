import { mkdirSync, writeFileSync } from "node:fs";
import { parse, relative, resolve, sep } from "node:path";

import type { Plugin } from "@custom-elements-manifest/analyzer";

import { cemToDts } from "./cem-to-dts.js";
import { cemToSvelteDts } from "./cem-to-svelte-dts.js";

export interface Options {
  /**
   * The directory to paths relative to
   */
  cwd?: string;

  /**
   * The path to write the `.d.ts` file out to
   */
  path: string;

  /**
   * Additionally emit types for using the elements in Svelte markup
   */
  svelte?: {
    /**
     * The path to write the Svelte `.d.ts` file out to
     */
    path: string;
  };
}

function writeFile(path: string, contents: string): void {
  const { dir: outputDir } = parse(path);
  mkdirSync(outputDir, { recursive: true });

  writeFileSync(path, contents);
}

/**
 * Normalizes a path to a posix path relative to `cwd`, the root the manifest's
 * module paths are relative to
 */
function manifestRelativePath(cwd: string, path: string): string {
  return relative(cwd, path).split(sep).join("/");
}

export function dts(options: Options): Plugin {
  const { cwd = process.cwd(), path, svelte } = options;
  const outFilePath = resolve(cwd, path);
  const svelteOutFilePath = svelte && resolve(cwd, svelte.path);

  return {
    name: "cem-plugin-dts",

    packageLinkPhase({ customElementsManifest, ts }) {
      const dts = cemToDts({
        customElementsManifest,
        path: manifestRelativePath(cwd, outFilePath),
      });

      writeFile(outFilePath, dts);

      if (svelteOutFilePath) {
        const svelteDts = cemToSvelteDts({
          customElementsManifest,
          path: manifestRelativePath(cwd, svelteOutFilePath),
          htmlElementPath: manifestRelativePath(cwd, outFilePath),
        });

        writeFile(svelteOutFilePath, svelteDts);
      }
    },
  };
}
