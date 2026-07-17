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

type _HTMLMyButtonElement = HTMLMyButtonElement;
type _HTMLMyBadgeElement = HTMLMyBadgeElement;

export type {
  _HTMLMyButtonElement as HTMLMyButtonElement,
  _HTMLMyBadgeElement as HTMLMyBadgeElement,
};
