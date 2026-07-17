declare global {
  interface HTMLGreeterElement extends HTMLElement {
    label: string | undefined;
    /**
     * Find the currently-highlighted element
     */
    highlighted(): HTMLElement | undefined;
  }

  interface HTMLElementTagNameMap {
    "svelte-vite": HTMLGreeterElement;
  }
}

type _HTMLGreeterElement = HTMLGreeterElement;

export type { _HTMLGreeterElement as HTMLGreeterElement };
