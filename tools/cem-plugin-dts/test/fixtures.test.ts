import * as assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { test } from "node:test";
import * as url from "node:url";

import { cemToDts } from "../src/cem-to-dts.ts";
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
    const generated = cemToDts({ customElementsManifest });

    const expected = await fs.readFile(path.resolve(root, "types.d.ts"), { encoding: "utf-8" });

    assert.strictEqual(normalizeTypeScript(generated), normalizeTypeScript(expected));
  });
}
