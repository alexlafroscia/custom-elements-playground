import * as ts from "typescript";

export function normalizeTypeScript(source: string): string {
  const sourceFile = ts.createSourceFile("temp.d.ts", source, ts.ScriptTarget.Latest, true);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return printer.printFile(sourceFile);
}
