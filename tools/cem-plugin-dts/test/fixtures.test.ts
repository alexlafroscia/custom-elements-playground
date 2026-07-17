import * as assert from "node:assert";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as url from "node:url";

import type { PackageLinkPhaseParams } from "@custom-elements-manifest/analyzer";
import * as ts from "typescript";

import { dts } from "../dist/index.js";
import { normalizeTypeScript } from "./test-helpers.ts";

const fixtureDirectory = url.fileURLToPath(import.meta.resolve("./fixtures"));
const fixtures = await fs.readdir(fixtureDirectory, {
  withFileTypes: true,
});

for (const fixture of fixtures) {
  test(fixture.name, async () => {
    const root = path.resolve(fixtureDirectory, fixture.name);

    const customElementsManifest = JSON.parse(
      await fs.readFile(path.resolve(root, "custom-elements.json"), { encoding: "utf-8" }),
    );

    // Fixtures can provide additional plugin options in an `options.json`
    const options = await fs
      .readFile(path.resolve(root, "options.json"), { encoding: "utf-8" })
      .then(JSON.parse)
      .catch(() => ({}));

    // The expected output lives at the same location within the fixture that
    // the plugin writes to within its `cwd`; fixtures default to `types.d.ts`
    const outputPath = options.path ?? "types.d.ts";
    const outputRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cem-plugin-dts-"));

    try {
      const plugin = dts({ ...options, path: outputPath, cwd: outputRoot });
      plugin.packageLinkPhase?.({
        // The analyzer types `ts` against its own TypeScript version, which
        // lags the one installed here; this plugin never uses it
        ts: ts as unknown as PackageLinkPhaseParams["ts"],
        customElementsManifest,
        context: {},
      });

      const generated = await fs.readFile(path.resolve(outputRoot, outputPath), {
        encoding: "utf-8",
      });
      const expected = await fs.readFile(path.resolve(root, outputPath), { encoding: "utf-8" });

      assert.strictEqual(normalizeTypeScript(generated), normalizeTypeScript(expected));
    } finally {
      await fs.rm(outputRoot, { recursive: true, force: true });
    }
  });
}
