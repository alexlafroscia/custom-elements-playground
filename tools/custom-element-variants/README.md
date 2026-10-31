# `custom-element-variants`

A library for delegating a custom element to one of multiple underlying implementations.

`createVariantElement` creates a "wrapper" custom element that, based on the value of its `variant`
attribute or property, instantiates one of several "variant" custom elements and forwards its
properties, methods, attributes, events, slotted content, and parts to it. This allows a single tag
name to be backed by entirely separate implementations, while consumers interact with it as if it
were the underlying element.

## Usage

Each variant is described by a `VariantDescriptor`: its tag name, along with the attributes,
members, slots, and parts that the wrapper forwards. Descriptors are usually generated from a
[Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) with
`describeVariant`:

```ts
import { comptime } from "comptime";
import { createVariantElement } from "custom-element-variants";
import { describeVariant } from "custom-element-variants/manifest";

import manifest from "../custom-elements.json";

// Variant elements must still be defined; importing their modules does so
import "./action-button.ts";
import "./link-button.ts";

const MyButton = createVariantElement({
  action: comptime(() => describeVariant(manifest, "action-button")),
  link: comptime(() => describeVariant(manifest, "link-button")),
});
customElements.define("my-button", MyButton);
```

```html
<my-button variant="action" label="Save"></my-button>
<my-button variant="link" label="Docs" href="/docs"></my-button>
```

`describeVariant` is a plain function, so it may be called at runtime, but doing so ships the entire
manifest. Running it at build time with [`comptime`](https://github.com/lukeed/comptime) inlines
only the descriptor.

Descriptors may also be written by hand, such as for elements that do not have a manifest:

```ts
const MyButton = createVariantElement({
  action: {
    tagName: "action-button",
    attributes: ["label"],
    members: [
      { name: "label", kind: "field" },
      { name: "pending", kind: "field", readonly: true },
      { name: "press", kind: "method" },
    ],
    slots: ["icon"],
    parts: ["label"],
  },
});
```

Any number of variants may be provided. The `variant` may be set as either an attribute or a
property, and may only be set once; attempting to change it, or setting it to a value that is not
one of the provided variants, throws an error.

## Types

The instance type of the returned class is a union of each variant's instance type, looked up from
`HTMLElementTagNameMap` by its tag name and discriminated on the `variant` property. Each variant's
tag name must therefore be in `HTMLElementTagNameMap`:

```ts
type MyButtonElement = InstanceType<typeof MyButton>;
// = (HTMLElementTagNameMap["action-button"] & { variant: "action" })
//   | (HTMLElementTagNameMap["link-button"] & { variant: "link" })

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
passing a descriptor for an element that does to `createVariantElement` is a type error.

The same type is available from a map of variants through `VariantElement`:

```ts
import type { VariantElement } from "custom-element-variants";

type MyButtonElement = VariantElement<typeof MyButton.variants>;
```

## Behavior

The variant element is rendered within the wrapper's shadow root. The wrapper itself is styled with
`display: contents`, so that layout is determined entirely by the variant element.

| Feature    | Wrapper → variant                                        | Variant → wrapper                                |
| ---------- | -------------------------------------------------------- | ------------------------------------------------ |
| Properties | Forwarded; buffered until the variant element is created | Read through from the variant                    |
| Methods    | Forwarded                                                |                                                  |
| Attributes | Forwarded, when described                                | Reflected, when described                        |
| Events     |                                                          | Events that are not `composed` are re-dispatched |
| Slots      | The default slot and described named slots are forwarded |                                                  |
| Parts      |                                                          | Described parts are exported through the wrapper |
| Focus      | Delegated to the variant (`delegatesFocus`)              |                                                  |

### Definition

Variant elements may be defined before or after the wrapper. If a variant's element has not been
defined when the `variant` is set, the variant element is created once it is; until then, properties
are buffered and attributes are applied when it is created.

Because descriptors only refer to variants by tag name, nothing about creating the wrapper defines
them. If a variant's element has not been defined two seconds after it was selected, a warning is
logged.

When the first variant element for each variant is created, its descriptor is compared against it,
and a warning is logged if they differ, which usually means that the manifest is out of date:

- members that do not exist on the element
- attributes that the element does not observe
- attributes that the element observes but that are not described

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

The parts a variant describes are exported through the wrapper with `exportparts`, so that they can
be styled as they would be on the variant element itself:

```css
my-button::part(label) {
  font-weight: bold;
}
```

Because the variant element is the `variant` part, a variant may not describe a part of its own with
that name; defining a wrapper with one throws an error.

The `hidden` attribute hides the wrapper and the variant element along with it.

### Properties and methods

When the wrapper is defined, forwarding accessors and methods are installed onto its prototype for
the members of every variant. This happens once per wrapper, rather than per instance, so that
instances share a single shape.

A member that is a field in any variant is forwarded as an accessor. Fields marked `readonly` in
every variant that describes them are installed without a setter, so assigning to them throws, as it
would on the variant element.

Properties set before the variant element is created are buffered and applied to it when it is.
Properties set on the element before it was upgraded are handled as well.

Methods called before the variant element is created fall back to the `HTMLElement` implementation
if one exists (such as `focus()`) and throw an error otherwise.

`describeVariant` describes only the public, non-static members of an element. Members that the
manifest inherits from classes outside of it (such as `LitElement`) are not described, so framework
internals are not forwarded.

### Attributes

Only described attributes are forwarded, so that attributes like `class` and `style` are not
duplicated onto the variant element.

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

- Only what a descriptor describes is forwarded; members, attributes, slots, and parts that are
  missing from the manifest are not.
- Attributes that the variant sets on itself but that are not described (such as `data-*` or
  `aria-*`) are not reflected to the wrapper.
- Custom states (`:state()`) set by the variant element are not reflected to the wrapper.
- Re-dispatched events are constructed with `new event.constructor(event.type, event)`, which may
  not work for `Event` subclasses with a different constructor signature.
- Because the wrapper uses `display: contents`, styles that apply to its box (such as `width`,
  `padding`, `border`, or `background`) have no effect; style the `variant` part instead.
- Form-associated variant elements are not supported.
