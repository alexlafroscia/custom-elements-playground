import type { Plugin } from "@custom-elements-manifest/analyzer";
import * as schema from "custom-elements-manifest" with { type: "json" };

import { isSvelteFileNode } from "./is-svelte-file.js";
import { getCompilerResult, type ParserCacheEntry } from "./parser-cache.js";

export function svelte(): Plugin {
  return {
    name: "cem-plugin-svelte",

    analyzePhase(params) {
      const { node, moduleDoc } = params;

      let parserCache: ParserCacheEntry;

      if (isSvelteFileNode(node)) {
        parserCache = getCompilerResult(node.fileName);

        const className = node.fileName.replace(".svelte", "");
        const tagName = parserCache.svelte.options?.customElement?.tag;

        // If the component does not have a configured tag name, don't register anything
        if (!tagName) {
          return;
        }

        const customElementDeclaration: schema.CustomElementDeclaration = {
          // Kind of a lie but :shrug:
          kind: "class",
          customElement: true,
          name: className,
          superclass: {
            name: "HTMLElement",
          },
          members: [],
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
      }
    },
  };
}
