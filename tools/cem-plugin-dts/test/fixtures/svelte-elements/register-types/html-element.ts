declare global {
  interface HTMLCounterElement extends HTMLElement {
    /**
     * The current count
     */
    count: number;
    label: string;
    total: number;
    instances: number;
    internal: number;
    /**
     * Increment the counter
     */
    increment(): void;
  }

  interface HTMLDividerElement extends HTMLElement {}

  interface HTMLElementTagNameMap {
    "my-counter": HTMLCounterElement;
    "my-divider": HTMLDividerElement;
  }
}

type _HTMLCounterElement = HTMLCounterElement;
type _HTMLDividerElement = HTMLDividerElement;

export type {
  _HTMLCounterElement as HTMLCounterElement,
  _HTMLDividerElement as HTMLDividerElement,
};
