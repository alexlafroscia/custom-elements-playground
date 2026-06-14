declare interface HTMLMyButtonElement extends HTMLElement {
  label: string;
}

declare interface HTMLMyBadgeElement extends HTMLElement {
  count: number;
}

declare interface HTMLElementTagNameMap {
  "my-button": HTMLMyButtonElement;
  "my-badge": HTMLMyBadgeElement;
}
