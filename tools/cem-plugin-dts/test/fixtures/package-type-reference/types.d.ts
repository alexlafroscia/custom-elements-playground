import type { Greeting, PersonOptions } from "greeting-types";
import type { GreetingStyle } from "greeting-types/style";

declare global {
  interface HTMLGreeterElement extends HTMLElement {
    person: PersonOptions;
    style: GreetingStyle | undefined;
    greeting: Greeting;
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
