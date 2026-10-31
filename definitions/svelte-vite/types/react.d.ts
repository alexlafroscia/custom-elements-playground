import type { DetailedHTMLProps, HTMLAttributes } from "react";

import type {} from "../register-types/html-element.ts";
import type { CustomElements } from "../register-types/jsx-elements.d.ts";

/**
 * `custom-element-jsx-integration` types each event handler as receiving a
 * `CustomEvent` whose `detail` is the event's documented type, but the
 * manifest documents the type of the event itself, so a `CustomEvent<string>`
 * becomes `CustomEvent<CustomEvent<string>>`. This unwraps the extra layer.
 */
type UnwrapEventHandlers<Props> = {
  [Key in keyof Props]: Key extends `on${string}`
    ? NonNullable<Props[Key]> extends (event: CustomEvent<infer E extends Event>) => void
      ? (event: [E] extends [never] ? Event : E) => void
      : Props[Key]
    : Props[Key];
};

/**
 * Each element accepts the props React allows on every HTML element, with
 * `ref` typed as the element itself, along with the props and event handlers
 * generated for it
 */
type ReactCustomElements = {
  [Tag in keyof CustomElements & keyof HTMLElementTagNameMap]: DetailedHTMLProps<
    HTMLAttributes<HTMLElementTagNameMap[Tag]>,
    HTMLElementTagNameMap[Tag]
  > &
    UnwrapEventHandlers<CustomElements[Tag]>;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ReactCustomElements {}
  }
}
