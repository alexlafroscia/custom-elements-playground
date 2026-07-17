import { relative } from "node:path";

import type tsModule from "@cem-analyzer-dep/typescript";
import type * as schema from "custom-elements-manifest";

type TypeReference = schema.TypeReference;

/**
 * Tracks where the source file's imports come from, so type references can be
 * attributed to the module specifier they are actually importable from.
 */
export interface ImportAttribution {
  /**
   * The declaration symbol each imported binding ultimately resolves to,
   * following re-export chains, mapped to the import's module specifier.
   */
  bySymbol: Map<tsModule.Symbol, string>;

  /**
   * The resolved file of each import declaration mapped to the import's module
   * specifier; a fallback for symbols that reach the file another way (for
   * example, through a namespace import).
   */
  byFile: Map<string, string>;
}

export function buildImportAttribution(
  sourceFile: tsModule.SourceFile,
  checker: tsModule.TypeChecker,
  ts: typeof tsModule,
): ImportAttribution {
  const bySymbol = new Map<tsModule.Symbol, string>();
  const byFile = new Map<string, string>();

  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const specifier = stmt.moduleSpecifier.text;

    const moduleSymbol = checker.getSymbolAtLocation(stmt.moduleSpecifier);
    const moduleFile = moduleSymbol?.declarations?.[0]?.getSourceFile().fileName;
    if (moduleFile && !byFile.has(moduleFile)) {
      byFile.set(moduleFile, specifier);
    }

    const importClause = stmt.importClause;
    if (!importClause) continue;

    const importedNames: tsModule.Identifier[] = [];
    if (importClause.name) {
      importedNames.push(importClause.name);
    }
    if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
      importedNames.push(...importClause.namedBindings.elements.map((element) => element.name));
    }

    for (const name of importedNames) {
      const symbol = checker.getSymbolAtLocation(name);
      if (!symbol) continue;
      const target =
        symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
      if (!bySymbol.has(target)) {
        bySymbol.set(target, specifier);
      }
    }
  }

  return { bySymbol, byFile };
}

/**
 * A declaration is globally available when it lives inside a `declare global`
 * block, or when its source file is not a module (a script file, like an
 * ambient `.d.ts` pulled in via `types`/`typeRoots`) and it isn't scoped to an
 * ambient module declaration like `declare module "svelte"`.
 */
function isGlobalDeclaration(decl: tsModule.Declaration, ts: typeof tsModule): boolean {
  for (let node: tsModule.Node | undefined = decl.parent; node; node = node.parent) {
    if (ts.isModuleDeclaration(node)) {
      if (node.flags & ts.NodeFlags.GlobalAugmentation) {
        return true;
      }
      if (ts.isStringLiteral(node.name)) {
        return false;
      }
    }
  }

  return !ts.isExternalModule(decl.getSourceFile());
}

/**
 * Derives an npm package name from a path under `node_modules`, so types that
 * a package re-exports from internal files are still attributed to the package
 * rather than a file path. TypeScript file names always use forward slashes.
 */
function packageNameFromNodeModulesPath(fileName: string): string | undefined {
  const parts = fileName.split("/");
  const index = parts.lastIndexOf("node_modules");
  if (index === -1) return undefined;

  const name = parts[index + 1];
  if (!name) return undefined;
  if (name.startsWith("@")) {
    const scopedName = parts[index + 2];
    return scopedName ? `${name}/${scopedName}` : undefined;
  }
  return name;
}

/**
 * Splits a bare import specifier into the npm package name and the subpath
 * within it, matching the schema's split between `package` and `module`
 * (for example, `greeting-types/style` → package `greeting-types`, module
 * `style`).
 */
function splitPackageSpecifier(specifier: string): Pick<TypeReference, "package" | "module"> {
  const parts = specifier.split("/");
  const packagePartCount = specifier.startsWith("@") ? 2 : 1;
  const packageName = parts.slice(0, packagePartCount).join("/");
  const subpath = parts.slice(packagePartCount).join("/");
  return subpath ? { package: packageName, module: subpath } : { package: packageName };
}

function resolvePackageOrModule(
  decl: tsModule.Declaration,
  specifier: string | undefined,
  cwd: string,
  ts: typeof tsModule,
): Pick<TypeReference, "package" | "module"> {
  if (isGlobalDeclaration(decl, ts)) {
    // The manifest schema labels globally-available symbols with this package name
    return { package: "global:" };
  }
  if (specifier && !ts.isExternalModuleNameRelative(specifier)) {
    return splitPackageSpecifier(specifier);
  }

  const fileName = decl.getSourceFile().fileName;
  const packageName = packageNameFromNodeModulesPath(fileName);
  if (packageName) {
    return { package: packageName };
  }
  return { module: relative(cwd, fileName) };
}

interface CollectionContext {
  typeText: string;
  cwd: string;
  imports: ImportAttribution;
  checker: tsModule.TypeChecker;
  ts: typeof tsModule;
  results: TypeReference[];
}

function addReference(symbol: tsModule.Symbol, name: string, context: CollectionContext): void {
  const decl = symbol.declarations?.[0];
  if (!decl) return;

  const start = context.typeText.indexOf(name);
  if (start === -1) return;

  const fileName = decl.getSourceFile().fileName;
  const specifier = context.imports.bySymbol.get(symbol) ?? context.imports.byFile.get(fileName);
  const reference: TypeReference = {
    name,
    start,
    end: start + name.length,
    ...resolvePackageOrModule(decl, specifier, context.cwd, context.ts),
  };

  const isDuplicate = context.results.some(
    (existing) =>
      existing.name === reference.name &&
      existing.package === reference.package &&
      existing.module === reference.module,
  );
  if (!isDuplicate) {
    context.results.push(reference);
  }
}

/**
 * Collects references from the checker's view of the type, following named
 * symbols through unions, intersections, aliases, and generic type arguments.
 */
function collectFromType(
  type: tsModule.Type,
  context: CollectionContext,
  seen: Set<tsModule.Type>,
): void {
  if (seen.has(type)) return;
  seen.add(type);

  const { checker, ts } = context;

  const symbol = type.aliasSymbol ?? type.symbol;
  if (symbol) {
    addReference(symbol, symbol.name, context);
  }

  for (const arg of type.aliasTypeArguments ?? []) {
    collectFromType(arg, context, seen);
  }

  if (type.flags & (ts.TypeFlags.Union | ts.TypeFlags.Intersection)) {
    for (const member of (type as tsModule.UnionOrIntersectionType).types) {
      collectFromType(member, context, seen);
    }
  }

  if (type.flags & ts.TypeFlags.Object) {
    const objectType = type as tsModule.ObjectType;
    if (objectType.objectFlags & ts.ObjectFlags.Reference) {
      for (const arg of checker.getTypeArguments(type as tsModule.TypeReference)) {
        collectFromType(arg, context, seen);
      }
    }
  }
}

/**
 * Collects references from the written type annotation. This catches names the
 * checker normalizes away — most notably a type alias of a union, which the
 * checker flattens into its members when combined into a larger union.
 */
function collectFromTypeNode(typeNode: tsModule.TypeNode, context: CollectionContext): void {
  const { checker, ts } = context;

  function walk(node: tsModule.Node): void {
    if (ts.isTypeReferenceNode(node)) {
      const nameNode = ts.isQualifiedName(node.typeName) ? node.typeName.right : node.typeName;
      const symbol = checker.getSymbolAtLocation(node.typeName);
      if (symbol) {
        const target =
          symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
        addReference(target, nameNode.text, context);
      }
    }
    node.forEachChild(walk);
  }

  walk(typeNode);
}

export function buildTypeReferences(
  type: tsModule.Type,
  typeNode: tsModule.TypeNode | undefined,
  typeText: string,
  cwd: string,
  imports: ImportAttribution,
  checker: tsModule.TypeChecker,
  ts: typeof tsModule,
): TypeReference[] {
  const results: TypeReference[] = [];
  const context: CollectionContext = { typeText, cwd, imports, checker, ts, results };

  collectFromType(type, context, new Set());
  if (typeNode) {
    collectFromTypeNode(typeNode, context);
  }

  // The schema requires the indices unless the entire type string is the
  // referenced symbol itself
  return results.map((reference) => {
    if (reference.name !== typeText) return reference;
    const { start: _start, end: _end, ...rest } = reference;
    return rest;
  });
}
