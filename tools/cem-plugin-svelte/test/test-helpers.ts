import * as fs from "node:fs/promises";

// @ts-expect-error
import { create, ts } from "@custom-elements-manifest/analyzer";

import { overrideModuleCreation } from "../dist/override-module-creation.js";
import { svelte } from "../dist/plugin.js";
import { reset } from "../dist/parser-cache.js";

export async function generateManifest(path: string) {
  const fixtureContents = await fs.readdir(path, {
    withFileTypes: true,
  });
  const globs = fixtureContents
    .filter((entry) => entry.name.endsWith("svelte"))
    .map((entry) => entry.name);

  const moduleCreator = overrideModuleCreation({
    cwd: path,
    compilerOptions: {
      customElement: true,
    },
  });
  const modules = moduleCreator({
    ts,
    globs: globs,
  });

  const result = create({ modules, plugins: [svelte()] });

  // Make sure that the parser cache does not bleed between tests
  reset();

  return result;
}
