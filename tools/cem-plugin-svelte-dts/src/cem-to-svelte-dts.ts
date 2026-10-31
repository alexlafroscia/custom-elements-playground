import * as schema from "custom-elements-manifest" with { type: "json" };

type Package = schema.Package;

interface Options {
  customElementsManifest: Package;

  /**
   * Module specifiers to import alongside the generated types, such as a file
   * that registers the elements in `HTMLElementTagNameMap`
   */
  imports?: string[];
}

/**
 * Whether Svelte markup can set a class member as a prop
 *
 * Svelte sets a prop on a custom element as a property when the element
 * defines one by that name, so only public, writable instance fields apply.
 */
function isProp(member: schema.ClassMember): boolean {
  return (
    member.kind === "field" &&
    !member.static &&
    !member.readonly &&
    (member.privacy ?? "public") === "public"
  );
}

/**
 * Generates a module augmentation of `svelte/elements` that types each custom
 * element in the manifest when used in Svelte markup.
 *
 * Each element accepts the attributes and event handlers Svelte allows on
 * every HTML element, along with its props. The type of each prop is read from
 * the element's entry in `HTMLElementTagNameMap`, so the elements must be
 * registered there. Props are optional, as a custom element cannot require
 * that a property be set.
 */
export function cemToSvelteDts({ customElementsManifest, imports = [] }: Options): string {
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

      const tagName = JSON.stringify(declaration.tagName);
      const element = `HTMLElementTagNameMap[${tagName}]`;
      const propNames = (declaration.members ?? [])
        .filter(isProp)
        .map((member) => JSON.stringify(member.name));

      const props =
        propNames.length === 0 ? "" : ` & Partial<Pick<${element}, ${propNames.join(" | ")}>>`;

      entries.push(`    ${tagName}: HTMLAttributes<${element}>${props};`);
    }
  }

  return [
    'import type { HTMLAttributes } from "svelte/elements";',
    ...(imports.length === 0
      ? []
      : ["", ...imports.map((specifier) => `import type {} from ${JSON.stringify(specifier)};`)]),
    "",
    // Augmenting `svelte/elements` requires this file to be a module, which
    // the import above ensures
    'declare module "svelte/elements" {',
    "  interface SvelteHTMLElements {",
    ...entries,
    "  }",
    "}",
    "",
  ].join("\n");
}
