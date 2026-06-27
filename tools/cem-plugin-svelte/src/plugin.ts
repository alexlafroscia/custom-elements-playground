import { parse, resolve } from "node:path";

import type { Plugin } from "@custom-elements-manifest/analyzer";
import * as schema from "custom-elements-manifest" with { type: "json" };

import { isSvelteFileNode } from "./is-svelte-file.js";
import { mergeDocOverrides } from "./merge-doc-overrides.js";
import { resolveBaseClassMembers } from "./resolve-base-class-members.js";
import { resolveComponentDoc } from "./resolve-component-doc.js";
import { resolveMethods } from "./resolve-methods.js";
import { resolvePropMembers } from "./resolve-prop-members.js";
import type { SveltePluginState } from "./state.js";

export function createPlugin(state: SveltePluginState): Plugin {
  return {
    name: "cem-plugin-svelte",

    analyzePhase({ ts, node, moduleDoc }) {
      if (!isSvelteFileNode(node)) return;

      const parserCache = state.parserCache.get(node.fileName);
      const tagName = parserCache.svelte.options?.customElement?.tag;
      if (!tagName) return;

      const parsedFileName = parse(node.fileName);
      const className = parsedFileName.name;
      const absolutePath = resolve(state.cwd, node.fileName);

      const members = resolvePropMembers(absolutePath, state, ts);

      const methodMembers =
        state.checker && state.program
          ? resolveMethods(absolutePath, state.program, state.checker, ts)
          : [];

      const baseClassMembers = resolveBaseClassMembers(absolutePath, parserCache);

      const attributeMembers = members.filter((m) => m.attributeEligible);
      const componentDoc = resolveComponentDoc(parserCache);
      const {
        attributes: commentAttributes,
        props: commentProps,
        ...componentDocProps
      } = componentDoc ?? {};

      type AttributeEntry = {
        name: string;
        type?: schema.Type;
        description?: string;
        fieldName?: string;
      };
      type MemberEntry = {
        kind: "field" | "method";
        name: string;
        type?: schema.Type;
        description?: string;
        attribute?: string;
        parameters?: schema.Parameter[];
        return?: schema.Type;
      };

      const builtMembers: MemberEntry[] = [
        ...members.map((m) => ({
          kind: "field" as const,
          name: m.name,
          type: m.type,
          ...(m.description !== undefined ? { description: m.description } : {}),
          ...(m.attributeEligible ? { attribute: m.name } : {}),
        })),
        ...methodMembers.map((m) => ({
          kind: "method" as const,
          name: m.name,
          ...(m.description !== undefined ? { description: m.description } : {}),
          parameters: m.parameters,
          return: m.return,
        })),
        ...baseClassMembers.map((m) =>
          m.kind === "field"
            ? {
                kind: "field" as const,
                name: m.name,
                ...(m.type !== undefined ? { type: m.type } : {}),
                ...(m.description !== undefined ? { description: m.description } : {}),
              }
            : {
                kind: "method" as const,
                name: m.name,
                ...(m.description !== undefined ? { description: m.description } : {}),
              },
        ),
      ];

      const builtAttributes: AttributeEntry[] = attributeMembers.map((m) => ({
        name: m.name,
        type: m.type,
        ...(m.description !== undefined ? { description: m.description } : {}),
        fieldName: m.name,
      }));

      const finalMembers = mergeDocOverrides(builtMembers, commentProps ?? [], (o) => ({
        kind: "field" as const,
        name: o.name,
        ...(o.type !== undefined ? { type: o.type } : {}),
        ...(o.description !== undefined ? { description: o.description } : {}),
      }));

      const finalAttributes = mergeDocOverrides(builtAttributes, commentAttributes ?? [], (o) => ({
        name: o.name,
        ...(o.type !== undefined ? { type: o.type } : {}),
        ...(o.description !== undefined ? { description: o.description } : {}),
      }));

      const customElementDeclaration: schema.CustomElementDeclaration = {
        kind: "class",
        customElement: true,
        name: className,
        tagName,
        superclass: { name: "HTMLElement" },
        ...(componentDocProps as Partial<schema.CustomElementDeclaration>),
        members: finalMembers as schema.ClassMember[],
        ...(finalAttributes.length > 0
          ? { attributes: finalAttributes as schema.Attribute[] }
          : {}),
      };

      moduleDoc.declarations.push(customElementDeclaration);

      const customElementExport: schema.CustomElementExport = {
        kind: "custom-element-definition",
        name: tagName,
        declaration: {
          name: className,
          module: node.fileName,
        },
      };

      moduleDoc.exports.push(customElementExport);
    },
  };
}
