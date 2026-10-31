import type { HTMLAttributes } from "svelte/elements";

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "my-greeter": HTMLAttributes<HTMLElementTagNameMap["my-greeter"]> &
      Partial<Pick<HTMLElementTagNameMap["my-greeter"], "name">>;
  }
}
