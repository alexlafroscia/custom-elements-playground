import type { Greeting, PersonOptions } from "greeting-types";
import type { GreetingStyle } from "greeting-types/style";

export {};

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
