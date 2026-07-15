export {};

declare global {
  interface HTMLGreeterElement extends HTMLElement {
    /**
     * The element this greeter points at
     */
    target: HTMLGreeterTargetElement;
  }

  interface HTMLElementTagNameMap {
    "svelte-vite": HTMLGreeterElement;
  }
}
