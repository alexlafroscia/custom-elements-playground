// Loads the module augmented below, which also makes this file a module, as
// augmenting requires
import type {} from "svelte/elements";

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "my-divider": HTMLAttributes<HTMLElementTagNameMap["my-divider"]>;
  }
}
