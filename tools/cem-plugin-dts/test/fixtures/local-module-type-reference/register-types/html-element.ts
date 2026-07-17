import type { PersonOptions } from "../src/types.ts";

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

type _HTMLGreeterElement = HTMLGreeterElement;

export type { _HTMLGreeterElement as HTMLGreeterElement };
