import { readFileSync } from "node:fs";

import type { ParserCacheEntry } from "./parser-cache.js";

export interface BaseClassField {
  kind: "field";
  name: string;
  description?: string;
  type?: { text: string };
}

export interface BaseClassMethod {
  kind: "method";
  name: string;
  description?: string;
}

export type BaseClassMember = BaseClassField | BaseClassMethod;

function parseJSDocComment(value: string): string | undefined {
  const lines = value
    .replace(/^\*/, "")
    .split("\n")
    .map((line) => line.trim().replace(/^\*\s?/, ""))
    .filter(Boolean);
  return lines.length > 0 ? lines.join("\n").trim() : undefined;
}

function getDescription(
  leadingComments: Array<{ type: string; value: string }> | undefined,
): string | undefined {
  if (!leadingComments) return undefined;
  for (const comment of leadingComments) {
    if (comment.type === "Block" && comment.value.startsWith("*")) {
      return parseJSDocComment(comment.value);
    }
  }
  return undefined;
}

function findExtendClassBody(extend: unknown): unknown[] {
  // The extend value is ArrowFunctionExpression | Identifier per Svelte types,
  // but can also be FunctionExpression when written as a method shorthand.
  const fn = extend as any;
  const fnBody = fn.body;
  if (!fnBody || fnBody.type !== "BlockStatement") return [];

  const returnStmt = fnBody.body?.find((s: any) => s.type === "ReturnStatement");
  if (returnStmt?.argument?.type !== "ClassExpression") return [];

  return returnStmt.argument.body?.body ?? [];
}

export function resolveBaseClassMembers(
  absoluteSveltePath: string,
  cache: ParserCacheEntry,
): BaseClassMember[] {
  const extend = cache.svelte.options?.customElement?.extend;
  if (!extend) return [];

  const classBodyMembers = findExtendClassBody(extend);
  if (classBodyMembers.length === 0) return [];

  const source = readFileSync(absoluteSveltePath, "utf-8");
  const members: BaseClassMember[] = [];

  for (const member of classBodyMembers as any[]) {
    if (member.type === "PropertyDefinition" && !member.static) {
      const name = member.key?.name;
      if (typeof name !== "string") continue;

      const description = getDescription(member.leadingComments);
      const typeNode = member.typeAnnotation?.typeAnnotation;
      const type = typeNode ? { text: source.slice(typeNode.start, typeNode.end) } : undefined;

      members.push({
        kind: "field",
        name,
        ...(description !== undefined ? { description } : {}),
        ...(type !== undefined ? { type } : {}),
      });
    } else if (member.type === "MethodDefinition" && member.kind === "method" && !member.static) {
      const name = member.key?.name;
      if (typeof name !== "string" || name === "constructor") continue;

      const description = getDescription(member.leadingComments);

      members.push({
        kind: "method",
        name,
        ...(description !== undefined ? { description } : {}),
      });
    }
  }

  return members;
}
