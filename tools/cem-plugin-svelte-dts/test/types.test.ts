import * as assert from "node:assert";
import { test } from "node:test";
import * as url from "node:url";

import * as ts from "typescript";

// The expected output of a fixture is compiled alongside a usage file whose
// `@ts-expect-error` comments assert which props are accepted, so that the
// augmentation is verified to take effect, not only to have the expected text
const rootNames = [
  "./fixtures/member-filtering/svelte-elements.d.ts",
  "./types/html-element.d.ts",
  "./types/usage.ts",
].map((specifier) => url.fileURLToPath(import.meta.resolve(specifier)));

test("the generated types apply to svelte/elements", () => {
  const program = ts.createProgram({
    rootNames,
    options: {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
      types: [],
      // The generated file is a declaration file, which must be checked too
      skipLibCheck: false,
    },
  });

  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file && rootNames.includes(diagnostic.file.fileName));

  assert.deepStrictEqual(
    diagnostics.map((diagnostic) => {
      const { line } = diagnostic.file!.getLineAndCharacterOfPosition(diagnostic.start!);
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      return `${diagnostic.file!.fileName}:${line + 1}: ${message}`;
    }),
    [],
  );
});
