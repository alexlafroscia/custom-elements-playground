export {};

declare global {
  interface HTMLCounterElement extends HTMLElement {
    /**
     * The current count
     */
    count: number;
    /**
     * Increment the counter
     */
    increment(): void;
    add(amount: number): void;
  }

  interface HTMLElementTagNameMap {
    "my-counter": HTMLCounterElement;
  }
}
