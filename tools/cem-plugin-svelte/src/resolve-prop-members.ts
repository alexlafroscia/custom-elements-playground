import { relative } from "node:path";

import type tsModule from "@cem-analyzer-dep/typescript";
import type * as schema from "custom-elements-manifest";

import type { AttributeEntry, FieldEntry } from "./manifest-entries.js";
import type { SveltePluginState } from "./state.js";

type TypeReference = schema.TypeReference;

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

function buildImportSpecifierMap(
  sourceFile: tsModule.SourceFile,
  checker: tsModule.TypeChecker,
  ts: typeof tsModule,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const stmt of sourceFile.statements) {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      const specifier = stmt.moduleSpecifier.text;
      const moduleSymbol = checker.getSymbolAtLocation(stmt.moduleSpecifier);
      const moduleFile = moduleSymbol?.declarations?.[0]?.getSourceFile().fileName;
      if (moduleFile) {
        map.set(moduleFile, specifier);
      }
    }
  }
  return map;
}

function resolvePackageOrModule(
  fileName: string,
  specifier: string | undefined,
  cwd: string,
  ts: typeof tsModule,
): Pick<TypeReference, "package" | "module"> {
  if (specifier && !ts.isExternalModuleNameRelative(specifier)) {
    return { package: specifier };
  }
  return { module: relative(cwd, fileName) };
}

function collectTypeReferences(
  type: tsModule.Type,
  typeText: string,
  cwd: string,
  importSpecifiers: Map<string, string>,
  checker: tsModule.TypeChecker,
  ts: typeof tsModule,
  results: TypeReference[],
): void {
  if (type.symbol) {
    const decl = type.symbol.declarations?.[0];
    if (decl) {
      const start = typeText.indexOf(type.symbol.name);
      if (start !== -1) {
        const fileName = decl.getSourceFile().fileName;
        results.push({
          name: type.symbol.name,
          start,
          end: start + type.symbol.name.length,
          ...resolvePackageOrModule(fileName, importSpecifiers.get(fileName), cwd, ts),
        });
      }
    }
  }

  if (type.flags & ts.TypeFlags.Object) {
    const objectType = type as tsModule.ObjectType;
    if (objectType.objectFlags & ts.ObjectFlags.Reference) {
      for (const arg of checker.getTypeArguments(type as tsModule.TypeReference)) {
        collectTypeReferences(arg, typeText, cwd, importSpecifiers, checker, ts, results);
      }
    }
  }
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

function buildTypeReferences(
  propType: tsModule.Type,
  typeText: string,
  cwd: string,
  importSpecifiers: Map<string, string>,
  checker: tsModule.TypeChecker,
  ts: typeof tsModule,
): TypeReference[] {
  const results: TypeReference[] = [];
  collectTypeReferences(propType, typeText, cwd, importSpecifiers, checker, ts, results);
  if (results.length <= 1) {
    return results.map(({ start: _start, end: _end, ...ref }) => ref);
  }
  return results;
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
  const importSpecifiers = buildImportSpecifierMap(sourceFile, checker, ts);

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

    const text = checker.typeToString(propType);
    const references = buildTypeReferences(propType, text, cwd, importSpecifiers, checker, ts);
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
