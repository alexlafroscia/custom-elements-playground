import type tsModule from "@cem-analyzer-dep/typescript";
import type * as schema from "custom-elements-manifest";

import type { MethodEntry } from "./manifest-entries.js";
import type { SveltePluginState } from "./state.js";
import { buildImportAttribution, buildTypeReferences } from "./type-references.js";

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
  state: SveltePluginState,
  ts: typeof tsModule,
): MethodEntry[] {
  const { program, cwd } = state;
  if (!program || !state.checker) return [];
  const checker = state.checker;

  const sourceFile = program.getSourceFile(absoluteSveltePath + ".tsx");
  if (!sourceFile) return [];

  const exportedNames = getExportedMethodNames(sourceFile, ts, checker);
  if (exportedNames.size === 0) return [];

  const imports = buildImportAttribution(sourceFile, checker, ts);

  function toManifestType(
    type: tsModule.Type,
    typeNode: tsModule.TypeNode | undefined,
  ): schema.Type {
    const text = checker.typeToString(type);
    const references = buildTypeReferences(type, typeNode, text, cwd, imports, checker, ts);
    return references.length > 0 ? { text, references } : { text };
  }

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
      const parameters = (signature?.parameters ?? []).map((param) => {
        const declaration = param.valueDeclaration;
        const declaredTypeNode =
          declaration && ts.isParameter(declaration) ? declaration.type : undefined;
        return {
          name: param.name,
          type: toManifestType(checker.getTypeOfSymbol(param), declaredTypeNode),
        };
      });

      methods.push({
        kind: "method",
        name: node.name.text,
        ...(description ? { description } : {}),
        parameters,
        return: {
          type: toManifestType(signature?.getReturnType() ?? checker.getVoidType(), node.type),
        },
      });
    }
    ts.forEachChild(node, walk);
  }

  walk(sourceFile);
  return methods;
}
