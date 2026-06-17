export {};

declare global {
  interface HTMLMyButtonElement extends HTMLElement {
    label: string;
  }

  interface HTMLMyBadgeElement extends HTMLElement {
    count: number;
  }

  interface HTMLElementTagNameMap {
    "my-button": HTMLMyButtonElement;
    "my-badge": HTMLMyBadgeElement;
  }
}
