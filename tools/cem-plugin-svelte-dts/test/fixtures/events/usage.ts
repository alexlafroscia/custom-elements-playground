import type { SvelteHTMLElements } from "svelte/elements";

type Greeter = SvelteHTMLElements["my-greeter"];

// Handlers receive the documented event, with the element as `currentTarget`
export const handlers: Greeter = {
  ongreet: (event) => `${event.detail.toUpperCase()} ${event.currentTarget.name}`,
  onvalueChange: (event) => event.detail.toFixed(),
  "onname-cleared": (event) => event.type,
};

// Native event handlers are still accepted alongside them
export const nativeHandlers: Greeter = { onclick: (event) => event.button };

// @ts-expect-error handlers must accept the documented event type
export const wrongEventType: Greeter = { ongreet: (event: CustomEvent<number>) => event.detail };

// @ts-expect-error an event without a documented type is an `Event`, without `detail`
export const untypedEvent: Greeter = { "onname-cleared": (event) => event.detail };

// @ts-expect-error Svelte matches event names case-sensitively, so this would never be called
export const wrongCase: Greeter = { onvaluechange: () => {} };

// @ts-expect-error undocumented events have no handler
export const undocumentedEvent: Greeter = { onfarewell: () => {} };
