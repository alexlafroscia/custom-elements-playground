# `@cem-playground/svelte-consumer`

A Svelte 5 app demonstrating how a consumer uses the custom elements defined by
[`@cem-playground/svelte-vite`](../../definitions/svelte-vite/README.md), with every usage of those
elements in Svelte markup validated by `svelte-check`.

## Registering the elements

Importing the library's entry point defines its custom elements, and brings along the
`HTMLElementTagNameMap` augmentations that type them in the DOM:

```svelte
<script lang="ts">
  import "@cem-playground/svelte-vite";

  let element: HTMLSimpleViteElement | undefined = $state();
</script>

<svelte-vite name="World" bind:this={element}></svelte-vite>
```

## Type-checking usage in markup

Out of the box, Svelte types any element it doesn't know about as accepting any attribute, so a typo
or a value of the wrong type goes unnoticed. The library ships types for its elements in Svelte
markup from the `@cem-playground/svelte-vite/svelte` export, which are opted into with a type
reference in [`src/custom-elements.d.ts`](./src/custom-elements.d.ts):

```ts
/// <reference types="@cem-playground/svelte-vite/svelte" />
```

With the reference in place, `svelte-check` validates each prop against the element's properties:

```svelte
<!-- Error: Type 'number' is not assignable to type 'string'. -->
<svelte-vite name={42}></svelte-vite>

<!-- Error: Object literal may only specify known properties, and '"nmae"' does not exist in type ... -->
<svelte-vite nmae="World"></svelte-vite>
```

Events the element documents get typed handlers too. `<svelte-vite>` dispatches a `greet` event,
documented with `@fires {CustomEvent<string>} greet`, so its handler receives a
`CustomEvent<string>`:

```svelte
<svelte-vite {name} ongreet={(event) => (greeted = [...greeted, event.detail])}></svelte-vite>

<!-- Error: Type 'string' is not assignable to type 'number'. -->
<svelte-vite ongreet={(event: CustomEvent<number>) => event.detail.toFixed()}></svelte-vite>
```

Svelte listens for the event named by the rest of an `on` attribute case-sensitively, so a handler
with the wrong case, like `onGreet`, is reported as an unknown prop rather than silently never being
called.

## Testing the types

`mise run check` runs `svelte-check` on the app, which shows that valid usage is accepted. It can't
show that invalid usage is rejected: if the library's Svelte types failed to apply, every element
would accept anything, and the app would still pass.

[`type-tests/usage.ts`](./type-tests/usage.ts) asserts what's rejected. Svelte markup has no
equivalent of `// @ts-expect-error`, so the file checks usages against `SvelteHTMLElements`, the
types `svelte-check` checks each element's props in markup against, with a `@ts-expect-error` on
each one that must be rejected. `mise run test:types` type-checks it with `tsc`; if a usage were
accepted, or the library's Svelte types failed to apply, its directive would be reported as unused.

## Tasks

| Task                  | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `mise run dev`        | Start the development server                                 |
| `mise run build`      | Build the app                                                |
| `mise run check`      | Run all svelte-check / tsc type checks                       |
| `mise run test`       | Run checks, then verify that invalid usage is reported       |
| `mise run test:types` | Verify that invalid usage of the custom elements is reported |
