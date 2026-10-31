import * as assert from "node:assert";
import { test } from "node:test";
import * as url from "node:url";

import * as ts from "typescript";

// The program is described by `types/tsconfig.json`, so that editors check
// `usage.ts` against the generated types just as this test does
const configPath = url.fileURLToPath(import.meta.resolve("./types/tsconfig.json"));

function format(diagnostic: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  if (!diagnostic.file) return message;

  const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
  return `${diagnostic.file.fileName}:${line + 1}: ${message}`;
}

test("the generated types apply to svelte/elements", () => {
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

  // Only the files under test; those of `svelte` itself are not our concern
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file && config.fileNames.includes(diagnostic.file.fileName));

  assert.deepStrictEqual(diagnostics.map(format), []);
});
