import * as ts from "typescript";

export function normalizeTypeScript(source: string): string {
  const sourceFile = ts.createSourceFile("temp.d.ts", source, ts.ScriptTarget.Latest, true);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  // The printer preserves trailing commas, which are a formatting choice
  return printer.printFile(sourceFile).replace(/,(\s*[}\])])/g, "$1");
}
