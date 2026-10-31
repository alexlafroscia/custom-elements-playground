import * as assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { test } from "node:test";
import * as url from "node:url";

import * as ts from "typescript";

// Each fixture's `tsconfig.json` compiles its expected output alongside a
// registration of its elements, so that the generated types are verified to
// take effect, not only to have the expected text; a fixture can add a usage
// file whose `@ts-expect-error` comments assert which props are accepted
const fixtureDirectory = url.fileURLToPath(import.meta.resolve("./fixtures"));
const fixtures = await fs.readdir(fixtureDirectory, {
  withFileTypes: true,
});

function format(diagnostic: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  if (!diagnostic.file) return message;

  const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
  return `${diagnostic.file.fileName}:${line + 1}: ${message}`;
}

for (const fixture of fixtures) {
  test(`${fixture.name} compiles`, () => {
    const configPath = path.resolve(fixtureDirectory, fixture.name, "tsconfig.json");

    const configDiagnostics: ts.Diagnostic[] = [];
    const config = ts.getParsedCommandLineOfConfigFile(
      configPath,
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: (diagnostic) => configDiagnostics.push(diagnostic),
      },
    );
    assert.ok(config, configDiagnostics.map(format).join("\n"));
    assert.deepStrictEqual([...configDiagnostics, ...config.errors].map(format), []);

    const program = ts.createProgram({ rootNames: config.fileNames, options: config.options });

    // Only the fixture's own files, including any its generated output
    // imports; those of `svelte` itself are not our concern
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .filter(
        (diagnostic) =>
          diagnostic.file && !program.isSourceFileFromExternalLibrary(diagnostic.file),
      );

    assert.deepStrictEqual(diagnostics.map(format), []);
  });
}
