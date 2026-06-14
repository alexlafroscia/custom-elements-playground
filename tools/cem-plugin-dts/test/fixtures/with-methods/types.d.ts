declare interface HTMLCounterElement extends HTMLElement {
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

declare interface HTMLElementTagNameMap {
  "my-counter": HTMLCounterElement;
}
