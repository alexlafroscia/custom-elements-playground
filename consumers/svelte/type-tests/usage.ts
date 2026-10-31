// Asserts which usages of the library's custom elements `svelte-check` accepts
// in markup, through `SvelteHTMLElements`, the types it checks each element's
// props against. Each rejected usage carries a `@ts-expect-error`, so if the
// library's Svelte types failed to apply, every directive would be reported as
// unused
import type { SvelteHTMLElements } from "svelte/elements";

type SimpleVite = SvelteHTMLElements["svelte-vite"];
type MutableState = SvelteHTMLElements["mutable-state"];

// Props are typed by the element, alongside the attributes and event handlers
// of every HTML element
export const props: SimpleVite = {
  name: "World",
  class: "greeting",
  onclick: (event) => event.currentTarget.getName(),
};

// Handlers for the element's events receive the event it dispatches
export const events: SimpleVite = {
  ongreet: (event) => event.detail.toUpperCase(),
};

// @ts-expect-error `name` must be a string
export const wrongPropType: SimpleVite = { name: 42 };

// @ts-expect-error props the element doesn't define are rejected
export const unknownProp: SimpleVite = { nmae: "World" };

// @ts-expect-error `expose` must be a string
export const wrongPropTypeOnOtherElement: MutableState = { expose: true };

// @ts-expect-error methods are not props
export const method: SimpleVite = { getName: () => "World" };

// @ts-expect-error event handlers must accept the event the element dispatches
export const wrongEventType: SimpleVite = { ongreet: (event: CustomEvent<number>) => event.detail };

// @ts-expect-error Svelte matches event names case-sensitively, so `onGreet` would never be called
export const wrongEventCase: SimpleVite = { onGreet: () => {} };

// @ts-expect-error elements accept no handlers for events they don't document
export const undocumentedEvent: MutableState = { ongreet: () => {} };
