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
 * A property key for `name`, quoted only when it is not a valid identifier
 */
function propertyKey(name: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
}

/**
 * The handler prop for each event the element dispatches
 *
 * Svelte listens for the event named by the rest of an `on` attribute,
 * verbatim, so the prop for an event is `on` followed by its exact name. The
 * handler is typed as Svelte types those of built-in events, with the event's
 * `currentTarget` being the element; an event without a documented type is
 * typed as `Event`.
 */
function eventHandlerProps(events: schema.Event[], element: string): string[] {
  return events
    .filter((event) => event.name)
    .flatMap((event) => {
      const type = event.type?.text || "Event";
      const handler = `(event: ${type} & { currentTarget: EventTarget & ${element} }) => any`;

      return [
        ...(event.description ? [`/** ${event.description.replaceAll("*/", "*\\/")} */`] : []),
        `${propertyKey(`on${event.name}`)}?: ${handler};`,
      ];
    });
}

/**
 * Generates a module augmentation of `svelte/elements` that types each custom
 * element in the manifest when used in Svelte markup.
 *
 * Each element accepts the attributes and event handlers Svelte allows on
 * every HTML element, along with its props and handlers for the events it
 * dispatches. The type of each prop is read from the element's entry in
 * `HTMLElementTagNameMap`, so the elements must be registered there. Props are
 * optional, as a custom element cannot require that a property be set.
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

      const handlerProps = eventHandlerProps(declaration.events ?? [], element);
      const handlers =
        handlerProps.length === 0
          ? ""
          : ` & {\n${handlerProps.map((line) => `      ${line}`).join("\n")}\n    }`;

      entries.push(`    ${tagName}: HTMLAttributes<${element}>${props}${handlers};`);
    }
  }

  // The import loads the module augmented below, and makes this file a module,
  // as augmenting requires; within the augmentation, `HTMLAttributes`
  // resolves to the export of `svelte/elements` itself, so it needs no import
  // of its own
  return [
    'import type {} from "svelte/elements";',
    ...imports.map((specifier) => `import type {} from ${JSON.stringify(specifier)};`),
    "",
    'declare module "svelte/elements" {',
    "  interface SvelteHTMLElements {",
    ...entries,
    "  }",
    "}",
    "",
  ].join("\n");
}
