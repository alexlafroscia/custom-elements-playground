# `custom-element-variants`

A library for delegating a custom element to one of multiple underlying implementations.

`createVariantElement` creates a "wrapper" custom element that, based on the value of its `variant`
attribute or property, instantiates one of several "variant" custom elements and forwards its
properties, methods, attributes, events, and slotted content to it. This allows a single tag name to
be backed by entirely separate implementations, while consumers interact with it as if it were the
underlying element.

## Usage

```ts
import { createVariantElement } from "custom-element-variants";

import { ActionButton } from "./action-button.ts";
import { LinkButton } from "./link-button.ts";

// Variants must be defined before the wrapper
customElements.define("action-button", ActionButton);
customElements.define("link-button", LinkButton);

const MyButton = createVariantElement({ action: ActionButton, link: LinkButton });
customElements.define("my-button", MyButton);
```

```html
<my-button variant="action" label="Save"></my-button>
<my-button variant="link" label="Docs" href="/docs"></my-button>
```

Any number of variants may be provided. The `variant` may be set as either an attribute or a
property, and may only be set once; attempting to change it, or setting it to a value that is not
one of the provided variants, throws an error.

## Types

The instance type of the returned class is a union of each variant's instance type, discriminated on
the `variant` property:

```ts
type MyButtonElement = InstanceType<typeof MyButton>;
// = (HTMLElement & ActionButton & { variant: "action" })
//   | (HTMLElement & LinkButton & { variant: "link" })

declare global {
  interface HTMLElementTagNameMap {
    "my-button": MyButtonElement;
  }
}

const button = document.querySelector("my-button")!;

if (button.variant === "link") {
  button.href; // `string`, only available on the `link` variant
}
```

Because the wrapper owns the `variant` property, variant elements may not declare one of their own;
passing a class that does to `createVariantElement` is a type error:

```ts
class OtherButton extends HTMLElement {
  variant = "primary";
}

createVariantElement({ other: OtherButton }); // Error: Type 'typeof OtherButton' is not assignable to type 'VariantConstructor'
```

The same type is available from a map of variants through `VariantElement`:

```ts
import type { VariantElement } from "custom-element-variants";

type MyButtonElement = VariantElement<typeof MyButton.variants>;
```

## Behavior

The variant element is rendered within the wrapper's shadow root. The wrapper itself is styled with
`display: contents`, so that layout is determined entirely by the variant element.

| Feature    | Wrapper → variant                                     | Variant → wrapper                                     |
| ---------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Properties | Forwarded; buffered until the variant is known        | Read through from the variant                         |
| Methods    | Forwarded                                             |                                                       |
| Attributes | Forwarded, when in the variant's `observedAttributes` | Reflected, when in the variant's `observedAttributes` |
| Events     |                                                       | Events that are not `composed` are re-dispatched      |
| Slots      | Default and named slots are forwarded to the variant  |                                                       |
| Focus      | Delegated to the variant (`delegatesFocus`)           |                                                       |

### Styles

Because the wrapper generates no box of its own, the variant element takes its place in the layout;
within a flex or grid container, for example, the variant element is the flex or grid item.

Properties that place an element within its parent would have no effect on the wrapper, so the
variant element inherits them from it instead. Setting any of these on the wrapper applies them to
the variant element:

- `flex`
- `order`
- `align-self` and `justify-self`
- `grid-area`
- `margin`

These take precedence over the variant element's own `:host` styles for the same properties.

Sizing properties, such as `width` and `height`, are not inherited, so that the variant element's
own sizing is preserved. The variant element is exposed as the `variant` part, which can be used to
style it directly:

```css
my-button::part(variant) {
  width: 100%;
}
```

The `hidden` attribute hides the wrapper and the variant element along with it.

### Properties and methods

When the wrapper is defined, the prototype chain of each variant (up to `HTMLElement.prototype`) is
walked to collect its accessors and methods, and forwarding accessors and methods are installed onto
the wrapper's prototype. This happens once per wrapper, rather than per instance, so that instances
share a single shape.

Properties set before the `variant` is known are buffered and applied to the variant element when it
is created. Properties set on the element before it was upgraded are handled as well.

Methods called before the `variant` is known fall back to the `HTMLElement` implementation if one
exists (such as `focus()`) and throw an error otherwise.

### Attributes

Only attributes that the variant lists in its `observedAttributes` are forwarded, so that attributes
like `class` and `style` are not duplicated onto the variant element.

Changes the variant makes to those attributes itself — including Lit properties with `reflect: true`
— are reflected back onto the wrapper so that they remain observable from the outside. Reflection
happens through a `MutationObserver`, and therefore on the next microtask rather than synchronously.
Values are only copied when they differ, so changes do not bounce between the two elements.

### Events

Events that are not `composed` do not cross the wrapper's shadow boundary. They are re-dispatched
from the wrapper so that listeners on it observe the same events that they would on the variant
element; calling `preventDefault()` on the re-dispatched event cancels the original as well.
`composed` events, such as `click`, already reach the wrapper and are left alone.

## Limitations

- Variant elements must be defined with `customElements.define` before the wrapper is defined, so
  that their properties can be discovered.
- Class fields (such as `message = ""`) are own properties of each instance rather than members of
  the prototype, so they cannot be discovered and are not forwarded. Accessors, including Lit
  reactive properties and Svelte props, are.
- Named slots are detected as children are added and removed, but not when the `slot` attribute of
  an existing child changes.
- Attributes that the variant sets on itself but does not observe (such as `data-*` or `aria-*`) are
  not reflected to the wrapper.
- Re-dispatched events are constructed with `new event.constructor(event.type, event)`, which may
  not work for `Event` subclasses with a different constructor signature.
- Because the wrapper uses `display: contents`, styles that apply to its box (such as `width`,
  `padding`, `border`, or `background`) have no effect; style the `variant` part instead.
- Form-associated variant elements are not supported.
