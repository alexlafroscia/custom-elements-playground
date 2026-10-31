import type {} from "svelte/elements";

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "my-greeter": HTMLAttributes<HTMLElementTagNameMap["my-greeter"]> &
      Partial<Pick<HTMLElementTagNameMap["my-greeter"], "name">>;
    "my-counter": HTMLAttributes<HTMLElementTagNameMap["my-counter"]> &
      Partial<Pick<HTMLElementTagNameMap["my-counter"], "count">>;
  }
}
