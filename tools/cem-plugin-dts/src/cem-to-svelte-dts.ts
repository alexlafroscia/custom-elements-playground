import { posix } from "node:path";

import * as schema from "custom-elements-manifest" with { type: "json" };

type Package = schema.Package;

interface Options {
  customElementsManifest: Package;

  /**
   * Where the emitted file will be written, relative to the same root the
   * manifest's module paths are relative to
   */
  path: string;

  /**
   * Where the file declaring the `HTMLElement` interfaces is written, relative
   * to the same root as `path`
   */
  htmlElementPath: string;
}

function relativeImportSpecifier(from: string, to: string): string {
  const specifier = posix.relative(posix.dirname(posix.normalize(from)), posix.normalize(to));
  return specifier.startsWith(".") ? specifier : `./${specifier}`;
}

/**
 * Generates a module augmentation of `svelte/elements` that types each custom
 * element in the manifest when used in Svelte markup.
 *
 * Svelte sets a prop on a custom element as a property when the element
 * defines one by that name, so each element accepts its public, writable
 * fields with the types declared on its `HTMLElement` interface, alongside the
 * attributes and event handlers shared by every HTML element. Fields are
 * optional, as a custom element cannot require that a property be set.
 */
export function cemToSvelteDts({ customElementsManifest, path, htmlElementPath }: Options): string {
  const interfaceNames: string[] = [];
  const entries: string[] = [];

  for (const module of customElementsManifest.modules) {
    for (const declaration of module.declarations ?? []) {
      if (
        declaration.kind !== "class" ||
        !("customElement" in declaration) ||
        !declaration.tagName
      ) {
        continue;
      }

      const interfaceName = `HTML${declaration.name}Element`;
      interfaceNames.push(interfaceName);

      const fieldNames = (declaration.members ?? [])
        .filter(
          (member) =>
            member.kind === "field" &&
            member.type &&
            !member.static &&
            !member.readonly &&
            (member.privacy ?? "public") === "public",
        )
        .map((member) => JSON.stringify(member.name));

      const props =
        fieldNames.length === 0
          ? ""
          : ` & Partial<Pick<${interfaceName}, ${fieldNames.join(" | ")}>>`;

      entries.push(`    "${declaration.tagName}": HTMLAttributes<${interfaceName}>${props};`);
    }
  }

  const imports = ['import type { HTMLAttributes } from "svelte/elements";'];
  if (interfaceNames.length > 0) {
    imports.push(
      "",
      `import type { ${interfaceNames.sort().join(", ")} } from "${relativeImportSpecifier(path, htmlElementPath)}";`,
    );
  }

  return [
    ...imports,
    "",
    'declare module "svelte/elements" {',
    "  interface SvelteHTMLElements {",
    ...entries,
    "  }",
    "}",
    "",
  ].join("\n");
}
