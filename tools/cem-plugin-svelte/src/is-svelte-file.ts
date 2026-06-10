import { parse } from "node:path";
import ts from "@cem-analyzer-dep/typescript";

function isSourceFileNode(node: ts.Node): node is ts.SourceFile {
  return node.kind === ts.SyntaxKind.SourceFile;
}

export function isSvelteFileNode(node: ts.Node): node is ts.SourceFile {
  if (isSourceFileNode(node)) {
    const parsedFileName = parse(node.fileName);

    return parsedFileName.ext.endsWith("svelte");
  }

  return false;
}
