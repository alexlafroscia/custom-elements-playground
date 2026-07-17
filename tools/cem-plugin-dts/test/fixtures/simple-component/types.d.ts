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

type _HTMLGreeterElement = HTMLGreeterElement;

export type { _HTMLGreeterElement as HTMLGreeterElement };
