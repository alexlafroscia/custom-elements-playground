import type tsModule from "@cem-analyzer-dep/typescript";

import type { MethodEntry } from "./manifest-entries.js";

function getExportedMethodNames(
  sourceFile: tsModule.SourceFile,
  ts: typeof tsModule,
  checker: tsModule.TypeChecker,
): Set<string> {
  const renderFn = sourceFile.statements.find(
    (s): s is tsModule.FunctionDeclaration =>
      ts.isFunctionDeclaration(s) && s.name?.text === "$$render",
  );
  if (!renderFn) return new Set();

  const sig = checker.getSignatureFromDeclaration(renderFn);
  if (!sig) return new Set();

  const exportsSymbol = sig.getReturnType().getProperty("exports");
  if (!exportsSymbol) return new Set();

  return new Set(
    checker.getPropertiesOfType(checker.getTypeOfSymbol(exportsSymbol)).map((s) => s.name),
  );
}

export function resolveMethods(
  absoluteSveltePath: string,
  program: tsModule.Program,
  checker: tsModule.TypeChecker,
  ts: typeof tsModule,
): MethodEntry[] {
  const sourceFile = program.getSourceFile(absoluteSveltePath + ".tsx");
  if (!sourceFile) return [];

  const exportedNames = getExportedMethodNames(sourceFile, ts, checker);
  if (exportedNames.size === 0) return [];

  const methods: MethodEntry[] = [];

  function walk(node: tsModule.Node) {
    if (ts.isFunctionDeclaration(node) && node.name && exportedNames.has(node.name.text)) {
      const symbol = checker.getSymbolAtLocation(node.name);
      const docParts = symbol?.getDocumentationComment(checker) ?? [];
      const description =
        docParts.length > 0
          ? docParts
              .map((c) => c.text)
              .join("")
              .trim() || undefined
          : undefined;

      const signature = checker.getSignatureFromDeclaration(node);
      const parameters = (signature?.parameters ?? []).map((param) => ({
        name: param.name,
        type: { text: checker.typeToString(checker.getTypeOfSymbol(param)) },
      }));

      methods.push({
        kind: "method",
        name: node.name.text,
        ...(description ? { description } : {}),
        parameters,
        return: {
          type: {
            text: checker.typeToString(signature?.getReturnType() ?? checker.getVoidType()),
          },
        },
      });
    }
    ts.forEachChild(node, walk);
  }

  walk(sourceFile);
  return methods;
}
