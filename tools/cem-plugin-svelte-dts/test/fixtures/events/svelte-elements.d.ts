import type {} from "svelte/elements";

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "my-greeter": HTMLAttributes<HTMLElementTagNameMap["my-greeter"]> &
      Partial<Pick<HTMLElementTagNameMap["my-greeter"], "name">> & {
        /** Dispatched with the name being greeted */
        ongreet?: (
          event: CustomEvent<string> & {
            currentTarget: EventTarget & HTMLElementTagNameMap["my-greeter"];
          },
        ) => any;
        onvalueChange?: (
          event: CustomEvent<number> & {
            currentTarget: EventTarget & HTMLElementTagNameMap["my-greeter"];
          },
        ) => any;
        "onname-cleared"?: (
          event: Event & { currentTarget: EventTarget & HTMLElementTagNameMap["my-greeter"] },
        ) => any;
      };
  }
}
