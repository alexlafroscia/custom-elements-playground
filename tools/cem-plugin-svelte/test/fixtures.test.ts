import { test } from "node:test";
import * as assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as url from "node:url";

import { generateManifest } from "./test-helpers.ts";

const fixtureDirectory = url.fileURLToPath(import.meta.resolve("./fixtures"));
const fixtures = await fs.readdir(fixtureDirectory, {
  withFileTypes: true,
});

for (const fixture of fixtures) {
  test(fixture.name, async () => {
    const root = path.resolve(fixtureDirectory, fixture.name);
    const generatedManifest = await generateManifest(root);

    const expected = await fs.readFile(
      path.resolve(root, "custom-elements.json"),
      {
        encoding: "utf-8",
      },
    );

    assert.deepStrictEqual(generatedManifest, JSON.parse(expected));
  });
}
