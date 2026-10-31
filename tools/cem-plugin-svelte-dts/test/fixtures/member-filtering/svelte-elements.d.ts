// Loads the module augmented below, which also makes this file a module, as
// augmenting requires
import type {} from "svelte/elements";

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "my-counter": HTMLAttributes<HTMLElementTagNameMap["my-counter"]> &
      Partial<Pick<HTMLElementTagNameMap["my-counter"], "count" | "step">>;
  }
}
