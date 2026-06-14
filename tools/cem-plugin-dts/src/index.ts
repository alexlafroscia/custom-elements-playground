import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { parse, resolve } from "node:path";

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
      const dts = cemToDts({ customElementsManifest });

      const { dir: outputDir } = parse(outFilePath);

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir);
        console.log(`Directory ${outputDir} created`);
      }

      writeFileSync(outFilePath, dts);
    },
  };
}
