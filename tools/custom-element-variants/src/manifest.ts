import type { CustomElementDeclaration, Package } from "custom-elements-manifest";

import type { VariantDescriptor, VariantMember } from "./types.js";

function findDeclaration(manifest: Package, tagName: string): CustomElementDeclaration | undefined {
  for (const module of manifest.modules) {
    for (const declaration of module.declarations ?? []) {
      if (declaration.kind !== "class" || !("customElement" in declaration)) continue;
      if (declaration.tagName === tagName) return declaration;
    }
  }
}

/**
 * Describe the element with the given tag name from a Custom Elements Manifest, for use as a
 * variant with `createVariantElement`.
 *
 * Only the public, non-static members of the element are described. This is intended to run at
 * build time (with `comptime`, for example) so that the manifest itself is not shipped.
 */
export function describeVariant<const T extends string>(
  manifest: Package,
  tagName: T,
): VariantDescriptor<T> {
  const declaration = findDeclaration(manifest, tagName);
  if (!declaration) throw new Error(`<${tagName}> was not found in the manifest`);

  const members: VariantMember[] = [];
  for (const member of declaration.members ?? []) {
    if (member.static || (member.privacy ?? "public") !== "public") continue;
    if (member.name.startsWith("#")) continue;

    if (member.kind === "method") members.push({ name: member.name, kind: "method" });
    else members.push({ name: member.name, kind: "field", readonly: member.readonly ?? false });
  }

  return {
    tagName,
    attributes: (declaration.attributes ?? []).map(({ name }) => name),
    members,
    slots: (declaration.slots ?? []).map(({ name }) => name).filter((name) => name !== ""),
    parts: (declaration.cssParts ?? []).map(({ name }) => name),
  };
}
