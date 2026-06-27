export {};

declare global {
  interface HTMLGreeterElement extends HTMLElement {
    /**
     * The name of the person to greet
     */
    name: string;
  }

  interface HTMLElementTagNameMap {
    "svelte-vite": HTMLGreeterElement;
  }
}
