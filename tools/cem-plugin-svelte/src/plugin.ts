import { resolve } from "node:path";

import type { Plugin } from "@custom-elements-manifest/analyzer";
import * as schema from "custom-elements-manifest" with { type: "json" };
import type tsModule from "@cem-analyzer-dep/typescript";

import { isSvelteFileNode } from "./is-svelte-file.js";
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

      const className = node.fileName.replace(".svelte", "");
      const absolutePath = resolve(state.cwd, node.fileName);

      const members =
        state.checker && state.program
          ? resolvePropMembers(absolutePath, state.program, state.checker, ts)
          : [];

      const customElementDeclaration: schema.CustomElementDeclaration = {
        kind: "class",
        customElement: true,
        name: className,
        tagName,
        superclass: { name: "HTMLElement" },
        members: members.map((m) => ({
          kind: "field",
          name: m.name,
          type: m.type,
          ...(m.description !== undefined
            ? { description: m.description }
            : {}),
          attribute: m.name,
        })),
        attributes: members.map((m) => ({
          name: m.name,
          type: m.type,
          ...(m.description !== undefined
            ? { description: m.description }
            : {}),
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
