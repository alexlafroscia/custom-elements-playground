import type { HTMLAttributes } from "svelte/elements";

import type { HTMLCounterElement, HTMLDividerElement } from "./html-element.ts";

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "my-counter": HTMLAttributes<HTMLCounterElement> &
      Partial<Pick<HTMLCounterElement, "count" | "label">>;
    "my-divider": HTMLAttributes<HTMLDividerElement>;
  }
}
