import type { HTMLAttributes } from "svelte/elements";

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "my-divider": HTMLAttributes<HTMLElementTagNameMap["my-divider"]>;
  }
}
