import { mkdirSync, writeFileSync } from "node:fs";
import { parse, resolve } from "node:path";

import type { Plugin } from "@custom-elements-manifest/analyzer";

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
   * Module specifiers to import alongside the generated types, such as a file
   * that registers the elements in `HTMLElementTagNameMap`
   */
  imports?: string[];
}

export function svelteDts(options: Options): Plugin {
  const { cwd = process.cwd(), path, imports } = options;
  const outFilePath = resolve(cwd, path);

  return {
    name: "cem-plugin-svelte-dts",

    packageLinkPhase({ customElementsManifest }) {
      const dts = cemToSvelteDts({ customElementsManifest, imports });

      const { dir: outputDir } = parse(outFilePath);
      mkdirSync(outputDir, { recursive: true });

      writeFileSync(outFilePath, dts);
    },
  };
}
