import type tsModule from "@cem-analyzer-dep/typescript";
import type * as schema from "custom-elements-manifest";

import type { AttributeEntry, FieldEntry } from "./manifest-entries.js";
import type { SveltePluginState } from "./state.js";
import { buildImportAttribution, buildTypeReferences } from "./type-references.js";

export interface ResolvedProps {
  members: FieldEntry[];
  attributes: AttributeEntry[];
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

function isUnionType(type: tsModule.Type, ts: typeof tsModule): type is tsModule.UnionType {
  return !!(type.flags & ts.TypeFlags.Union);
}

function isPrimitiveType(type: tsModule.Type, ts: typeof tsModule): boolean {
  if (isUnionType(type, ts)) {
    return type.types.every((t) => isPrimitiveType(t, ts));
  }
  return !!(
    type.flags &
    (ts.TypeFlags.String |
      ts.TypeFlags.StringLiteral |
      ts.TypeFlags.Number |
      ts.TypeFlags.NumberLiteral |
      ts.TypeFlags.Boolean |
      ts.TypeFlags.BooleanLiteral |
      ts.TypeFlags.Null |
      ts.TypeFlags.Undefined)
  );
}

/**
 * Uses the TypeScript type checker to resolve the props type of a Svelte component,
 * following imports across files. The source file is served under `absoluteSveltePath + ".tsx"`.
 */
export function resolvePropMembers(
  absoluteSveltePath: string,
  state: SveltePluginState,
  ts: typeof tsModule,
): ResolvedProps {
  const { program, checker, cwd } = state;
  const empty: ResolvedProps = { members: [], attributes: [] };
  if (!program || !checker) return empty;

  const sourceFile = program.getSourceFile(absoluteSveltePath + ".tsx");
  if (!sourceFile) return empty;

  const typeNode = findPropsCallTypeNode(sourceFile, ts);
  if (!typeNode) return empty;

  const type = checker.getTypeFromTypeNode(typeNode);
  const properties = checker.getPropertiesOfType(type);
  const imports = buildImportAttribution(sourceFile, checker, ts);

  const members: FieldEntry[] = [];
  const attributes: AttributeEntry[] = [];

  for (const symbol of properties) {
    const propType = checker.getTypeOfSymbol(symbol);
    const docParts = symbol.getDocumentationComment(checker);
    const description =
      docParts.length > 0
        ? docParts
            .map((c) => c.text)
            .join("")
            .trim()
        : undefined;

    const declaration = symbol.declarations?.[0];
    const declaredTypeNode =
      declaration && ts.isPropertySignature(declaration) ? declaration.type : undefined;

    const text = checker.typeToString(propType);
    const references = buildTypeReferences(
      propType,
      declaredTypeNode,
      text,
      cwd,
      imports,
      checker,
      ts,
    );
    const propManifestType: schema.Type = references.length > 0 ? { text, references } : { text };
    const attributeEligible = isPrimitiveType(propType, ts);

    members.push({
      kind: "field",
      name: symbol.name,
      type: propManifestType,
      ...(description !== undefined ? { description } : {}),
      ...(attributeEligible ? { attribute: symbol.name } : {}),
    });

    if (attributeEligible) {
      attributes.push({
        name: symbol.name,
        type: propManifestType,
        ...(description !== undefined ? { description } : {}),
        fieldName: symbol.name,
      });
    }
  }

  return { members, attributes };
}
