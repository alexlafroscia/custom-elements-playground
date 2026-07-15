import { parse, resolve } from "node:path";

import type { Plugin } from "@custom-elements-manifest/analyzer";
import * as schema from "custom-elements-manifest" with { type: "json" };

import { classNameFromFileName } from "./class-name-from-file-name.js";
import { isSvelteFileNode } from "./is-svelte-file.js";
import type { AttributeEntry, FieldEntry, MemberEntry } from "./manifest-entries.js";
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
      const className = classNameFromFileName(parsedFileName.name);
      const absolutePath = resolve(state.cwd, node.fileName);

      const { members: propMembers, attributes: propAttributes } = resolvePropMembers(
        absolutePath,
        state,
        ts,
      );

      const methodMembers =
        state.checker && state.program
          ? resolveMethods(absolutePath, state.program, state.checker, ts)
          : [];

      const baseClassMembers = resolveBaseClassMembers(absolutePath, parserCache);

      const componentDoc = resolveComponentDoc(parserCache);
      const {
        attributes: commentAttributes,
        props: commentProps,
        ...componentDocProps
      } = componentDoc ?? {};

      const builtMembers: MemberEntry[] = [...propMembers, ...methodMembers, ...baseClassMembers];

      const finalMembers = mergeDocOverrides(
        builtMembers,
        commentProps ?? [],
        (o): FieldEntry => ({
          kind: "field",
          name: o.name,
          ...(o.type !== undefined ? { type: o.type } : {}),
          ...(o.description !== undefined ? { description: o.description } : {}),
        }),
      );

      const finalAttributes = mergeDocOverrides(
        propAttributes,
        commentAttributes ?? [],
        (o): AttributeEntry => ({
          name: o.name,
          ...(o.type !== undefined ? { type: o.type } : {}),
          ...(o.description !== undefined ? { description: o.description } : {}),
        }),
      );

      const customElementDeclaration: schema.CustomElementDeclaration = {
        kind: "class",
        customElement: true,
        name: className,
        tagName,
        superclass: { name: "HTMLElement" },
        ...(componentDocProps as Partial<schema.CustomElementDeclaration>),
        members: finalMembers,
        ...(finalAttributes.length > 0 ? { attributes: finalAttributes } : {}),
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
