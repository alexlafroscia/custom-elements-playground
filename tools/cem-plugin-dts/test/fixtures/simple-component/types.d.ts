declare interface HTMLGreeterElement extends HTMLElement {
  /**
   * The name of the person to greet
   */
  name: string;
}

declare interface HTMLElementTagNameMap {
  "svelte-vite-custom": HTMLGreeterElement;
}
