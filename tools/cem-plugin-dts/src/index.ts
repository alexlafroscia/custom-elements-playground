import { mkdirSync, writeFileSync } from "node:fs";
import { parse, relative, resolve, sep } from "node:path";

import type { Plugin } from "@custom-elements-manifest/analyzer";

import { cemToDts } from "./cem-to-dts.js";

export interface Options {
  /**
   * The directory to paths relative to
   */
  cwd?: string;

  /**
   * The path to write the `.d.ts` file out to
   */
  path: string;
}

export function dts(options: Options): Plugin {
  const { cwd = process.cwd(), path } = options;
  const outFilePath = resolve(cwd, path);

  return {
    name: "cem-plugin-dts",

    packageLinkPhase({ customElementsManifest, ts }) {
      const dts = cemToDts({
        customElementsManifest,
        // Normalized to a posix path relative to `cwd`, the root the
        // manifest's module paths are relative to
        path: relative(cwd, outFilePath).split(sep).join("/"),
      });

      const { dir: outputDir } = parse(outFilePath);
      mkdirSync(outputDir, { recursive: true });

      writeFileSync(outFilePath, dts);
    },
  };
}
