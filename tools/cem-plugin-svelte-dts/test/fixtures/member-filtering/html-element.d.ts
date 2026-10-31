// Registers this fixture's elements, as a library would for the generated
// types to read their props from
declare global {
  interface HTMLCounterElement extends HTMLElement {
    /** The current count */
    count: number;
    step: number;
    readonly total: number;
    increment(): void;
  }

  interface HTMLElementTagNameMap {
    "my-counter": HTMLCounterElement;
  }
}

export {};
