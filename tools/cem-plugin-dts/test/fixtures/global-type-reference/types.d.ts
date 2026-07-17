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

type _HTMLGreeterElement = HTMLGreeterElement;

export type { _HTMLGreeterElement as HTMLGreeterElement };
