import type tsModule from "@cem-analyzer-dep/typescript";

export interface PropMember {
  name: string;
  type: { text: string };
  description?: string;
}

function findPropsCallTypeNode(
  sourceFile: tsModule.SourceFile,
  ts: typeof tsModule,
): tsModule.TypeNode | undefined {
  function walk(node: tsModule.Node): tsModule.TypeNode | undefined {
    if (
      ts.isVariableDeclaration(node) &&
      node.type &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === "$props"
    ) {
      return node.type;
    }
    return ts.forEachChild(node, walk);
  }
  return walk(sourceFile);
}

/**
 * Uses the TypeScript type checker to resolve the props type of a Svelte component,
 * following imports across files. The source file is served under `absoluteSveltePath + ".tsx"`.
 */
export function resolvePropMembers(
  absoluteSveltePath: string,
  program: tsModule.Program,
  checker: tsModule.TypeChecker,
  ts: typeof tsModule,
): PropMember[] {
  const sourceFile = program.getSourceFile(absoluteSveltePath + ".tsx");
  if (!sourceFile) return [];

  const typeNode = findPropsCallTypeNode(sourceFile, ts);
  if (!typeNode) return [];

  const type = checker.getTypeFromTypeNode(typeNode);
  const properties = checker.getPropertiesOfType(type);

  return properties.map((symbol) => {
    const propType = checker.getTypeOfSymbol(symbol);
    const docParts = symbol.getDocumentationComment(checker);
    const description = docParts.length > 0
      ? docParts.map((c) => c.text).join("").trim()
      : undefined;

    return {
      name: symbol.name,
      type: { text: checker.typeToString(propType) },
      description,
    };
  });
}
