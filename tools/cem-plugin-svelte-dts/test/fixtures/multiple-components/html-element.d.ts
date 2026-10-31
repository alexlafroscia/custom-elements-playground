// Registers this fixture's elements, as a library would for the generated
// types to read their props from
declare global {
  interface HTMLGreeterElement extends HTMLElement {
    /** The name of the person to greet */
    name: string;
  }

  interface HTMLCounterElement extends HTMLElement {
    count: number;
  }

  interface HTMLElementTagNameMap {
    "my-greeter": HTMLGreeterElement;
    "my-counter": HTMLCounterElement;
  }
}

export {};
