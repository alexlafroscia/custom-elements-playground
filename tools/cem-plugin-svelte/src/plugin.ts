import { parse, resolve } from "node:path";

import type { Plugin } from "@custom-elements-manifest/analyzer";
import * as schema from "custom-elements-manifest" with { type: "json" };

import { isSvelteFileNode } from "./is-svelte-file.js";
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

      const customElementDeclaration: schema.CustomElementDeclaration = {
        kind: "class",
        customElement: true,
        name: className,
        tagName,
        superclass: { name: "HTMLElement" },
        members: [
          ...members.map((m) => ({
            kind: "field" as const,
            name: m.name,
            type: m.type,
            ...(m.description !== undefined ? { description: m.description } : {}),
            attribute: m.name,
          })),
          ...methodMembers.map((m) => ({
            kind: "method" as const,
            name: m.name,
            ...(m.description !== undefined ? { description: m.description } : {}),
            parameters: m.parameters,
            return: m.return,
          })),
        ],
        attributes: members.map((m) => ({
          name: m.name,
          type: m.type,
          ...(m.description !== undefined ? { description: m.description } : {}),
          fieldName: m.name,
        })),
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
