import * as fs from "node:fs/promises";

// @ts-expect-error
import { create, ts } from "@custom-elements-manifest/analyzer";

import { createSveltePlugin } from "../dist/create-svelte-plugin.js";

export async function generateManifest(path: string) {
  const fixtureContents = await fs.readdir(path, {
    withFileTypes: true,
  });
  const globs = fixtureContents
    .filter((entry) => entry.name.endsWith("svelte"))
    .map((entry) => entry.name);

  const { plugin, overrideModuleCreation } = createSveltePlugin({
    cwd: path,
    compilerOptions: {
      customElement: true,
    },
  });

  const modules = overrideModuleCreation({ ts, globs });

  return create({ modules, plugins: [plugin] });
}
