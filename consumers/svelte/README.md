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

## Testing the types

Svelte markup has no equivalent of `// @ts-expect-error`, so the errors above can't be asserted
inline. Instead, [`type-tests/InvalidUsage.svelte`](./type-tests/InvalidUsage.svelte) collects
invalid usages, each preceded by an `@expect-error` comment naming the error it should produce, and
[`tests/type-check.test.ts`](./tests/type-check.test.ts) runs `svelte-check` against it and asserts
that exactly those errors are reported.

## Tasks

| Task                  | Description                                                  |
| --------------------- | ------------------------------------------------------------ |
| `mise run dev`        | Start the development server                                 |
| `mise run build`      | Build the app                                                |
| `mise run check`      | Run all svelte-check / tsc type checks                       |
| `mise run test`       | Run checks, then verify that invalid usage is reported       |
| `mise run test:types` | Verify that invalid usage of the custom elements is reported |
