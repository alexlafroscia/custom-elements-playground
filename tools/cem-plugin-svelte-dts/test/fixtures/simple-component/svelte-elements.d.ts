// Loads the module augmented below, which also makes this file a module, as
// augmenting requires
import type {} from "svelte/elements";

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "my-greeter": HTMLAttributes<HTMLElementTagNameMap["my-greeter"]> &
      Partial<Pick<HTMLElementTagNameMap["my-greeter"], "name">>;
  }
}
