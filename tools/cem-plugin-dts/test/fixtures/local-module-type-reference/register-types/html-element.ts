import type { PersonOptions } from "../src/types.ts";

export {};

declare global {
  interface HTMLGreeterElement extends HTMLElement {
    person: PersonOptions;
    /**
     * Get the person currently being greeted
     */
    currentPerson(): PersonOptions | undefined;
  }

  interface HTMLElementTagNameMap {
    "svelte-vite": HTMLGreeterElement;
  }
}
