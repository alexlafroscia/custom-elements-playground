import type { SvelteHTMLElements } from "svelte/elements";

type Counter = SvelteHTMLElements["my-counter"];

// Props are typed by the element, and optional
export const props: Counter = { count: 1, step: 2 };
export const noProps: Counter = {};

// The attributes and event handlers of every HTML element are accepted
export const attributes: Counter = {
  class: "counter",
  "aria-label": "Counter",
  "data-testid": "counter",
  onclick: (event) => event.currentTarget.increment(),
};

// @ts-expect-error props must match the type declared by the element
export const wrongType: Counter = { count: "1" };

// @ts-expect-error unknown props are rejected
export const unknownProp: Counter = { cuont: 1 };

// @ts-expect-error methods are not props
export const method: Counter = { increment: () => {} };

// @ts-expect-error readonly fields are not props
export const readonlyField: Counter = { total: 1 };

// @ts-expect-error static fields are not props
export const staticField: Counter = { instances: 1 };

// @ts-expect-error private fields are not props
export const privateField: Counter = { history: [] };

// @ts-expect-error protected fields are not props
export const protectedField: Counter = { pending: true };

// Unknown elements remain untyped
export const unknownElement: SvelteHTMLElements["not-registered"] = { anything: 1 };
