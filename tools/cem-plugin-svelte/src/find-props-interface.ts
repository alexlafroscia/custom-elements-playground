import type {
  CallExpression,
  Directive,
  Identifier,
  ModuleDeclaration,
  Statement,
  VariableDeclaration,
} from "estree";
import type { AST } from "svelte/compiler";

// TypeScript AST extensions not in @types/estree — produced by @sveltejs/acorn-typescript
export interface TSInterfaceDeclaration {
  type: "TSInterfaceDeclaration";
  id: Identifier;
  body: { type: "TSInterfaceBody"; body: unknown[] };
}

interface TSTypeAnnotation {
  type: "TSTypeAnnotation";
  typeAnnotation: { type: string; typeName?: Identifier };
}

function isVariableDeclaration(
  node: Directive | Statement | ModuleDeclaration,
): node is VariableDeclaration {
  return node.type === "VariableDeclaration";
}

/** Returns true if the call expression is a `$props()` rune call. */
function isPropsCall(init: CallExpression): boolean {
  return init.callee.type === "Identifier" && (init.callee as Identifier).name === "$props";
}

/**
 * Returns the name of the type annotation applied to the `$props()` call, if any.
 * e.g. `let { name }: Props = $props()` → `"Props"`
 */
function getInterfaceName(decl: VariableDeclaration): string | null {
  for (const declarator of decl.declarations) {
    if (declarator.init?.type !== "CallExpression") continue;
    if (!isPropsCall(declarator.init as CallExpression)) continue;

    const typeAnnotation = (declarator.id as unknown as { typeAnnotation?: TSTypeAnnotation })
      .typeAnnotation;
    const typeRef = typeAnnotation?.typeAnnotation;
    if (typeRef?.type === "TSTypeReference" && typeRef.typeName) {
      return typeRef.typeName.name;
    }
  }
  return null;
}

/**
 * Finds the interface that describes a component's props by locating the `$props()` rune call,
 * reading the type annotation on its result, then resolving that name to its `TSInterfaceDeclaration`.
 * Returns `null` if no `$props()` call exists or if it has no type annotation.
 */
export function findPropsInterface(root: AST.Root): TSInterfaceDeclaration | null {
  const body = root.instance?.content.body;
  if (!body) return null;

  let interfaceName: string | null = null;

  for (const statement of body) {
    if (!isVariableDeclaration(statement)) continue;
    interfaceName = getInterfaceName(statement);
    if (interfaceName) break;
  }

  if (!interfaceName) return null;

  for (const statement of body) {
    const node = statement as unknown as TSInterfaceDeclaration;
    if (node.type === "TSInterfaceDeclaration" && node.id.name === interfaceName) {
      return node;
    }
  }

  return null;
}
