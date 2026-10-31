# `@cem-playground/svelte-vite`

A playground package demonstrating how to generate Custom Elements Manifests and TypeScript type
definitions from Svelte custom elements, and how to test them with Vitest Browser.

## Custom Elements Manifest generation

[`@custom-elements-manifest/analyzer`](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
analyzes JavaScript and TypeScript source to produce a `custom-elements.json` manifest describing a
library's custom elements. Out of the box it doesn't understand Svelte, so
[`cem-plugin-svelte`](../../tools/cem-plugin-svelte/) teaches the analyzer how to extract component
metadata from `.svelte` files.

The config in [`custom-elements-manifest.config.js`](./custom-elements-manifest.config.js) shows the
full setup:

```js
import { dts } from "cem-plugin-dts";
import { createSveltePlugin } from "cem-plugin-svelte";

import svelteConfig from "./svelte.config.js";

const { plugin: svelte, overrideModuleCreation } = createSveltePlugin({
  compilerOptions: svelteConfig.compilerOptions,
});

export default {
  globs: ["./src/**/*.svelte"],
  plugins: [svelte, dts({ path: "./register-types/html-element.ts" })],
  overrideModuleCreation,
};
```

Running `@custom-elements-manifest/analyzer` with this config produces
[`custom-elements.json`](./custom-elements.json), which documents every custom element in the
package — its tag name, properties, methods, and JSDoc descriptions.

## HTML Element type definition generation

[`cem-plugin-dts`](../../tools/cem-plugin-dts/) is a second CEM plugin (see config above) that reads
the generated manifest and writes a `.d.ts` file. It produces interface declarations for each
element and merges them into TypeScript's built-in `HTMLElementTagNameMap`, so that
`document.querySelector("svelte-vite")` returns the correct type without any manual declarations.

The output at `register-types/html-element.ts` uses module form so it can be imported as a side
effect:

```ts
export {};

declare global {
  interface HTMLSimpleViteElement extends HTMLElement {
    /** The name of the person to greet */
    name: string;
    /** Return a value from inside of the component */
    getName(): string;
  }

  interface HTMLElementTagNameMap {
    "svelte-vite": HTMLSimpleViteElement;
    "mutable-state": HTMLMutableInternalStateElement;
  }
}
```

### Consuming the type definitions

`src/index.ts` imports the generated file as a side effect:

```ts
import "../register-types/html-element.js";
```

Because the import is part of the library's entry point, any consumer that imports
`@cem-playground/svelte-vite` automatically receives the `HTMLElementTagNameMap` augmentations — no
extra `tsconfig` configuration required.

For the test suite, which imports individual source files rather than the library entry point,
`tsconfig.test.json` includes the file directly:

```json
{ "include": ["tests/**/*.ts", "register-types/html-element.ts"] }
```

## Svelte type definitions

Svelte markup doesn't consult `HTMLElementTagNameMap`; without further declarations, a custom
element used in a `.svelte` file accepts any attribute with a value of any type.
[`custom-element-svelte-integration`](https://github.com/break-stuff/cem-tools/tree/main/packages/svelte-integration)
is a third CEM plugin that writes `register-types/svelte-elements.d.ts`, which exports a
`CustomElements` type mapping each tag name to the props documented in the manifest:

```js
customElementSveltePlugin({
  outdir: "./register-types",
  fileName: "svelte-elements.d.ts",
});
```

The generated file declares a `svelteHTML` namespace to register those types with Svelte, but as it
does so within a module, the declaration doesn't merge with Svelte's global one and has no effect.
[`types/svelte.d.ts`](./types/svelte.d.ts) registers the generated types with Svelte's
`SvelteHTMLElements` instead, adding the attributes and event handlers Svelte accepts on every HTML
element (`onclick`, `aria-*`, and so on), which the generated props don't include:

```ts
type SvelteCustomElements = {
  [Tag in keyof CustomElements]: HTMLAttributes<HTMLElementTagNameMap[Tag]> & CustomElements[Tag];
};

declare module "svelte/elements" {
  interface SvelteHTMLElements extends SvelteCustomElements {}
}
```

That file is published as the `./svelte` export. Unlike the `HTMLElementTagNameMap` augmentations it
isn't imported by the entry point, as doing so would require every consumer to have `svelte`
installed; Svelte apps opt in with a type reference instead:

```ts
/// <reference types="@cem-playground/svelte-vite/svelte" />
```

See [`consumers/svelte`](../../consumers/svelte/README.md) for an app that consumes the elements
this way.

## Browser testing with mutable properties

The tests run in a real browser via [Vitest Browser](https://vitest.dev/guide/browser/) +
[Playwright](https://playwright.dev/), and render elements using
[`vitest-browser-lit`](https://github.com/nickvdyck/vitest-browser-lit) Lit templates.

The interesting DX challenge: when a test needs to update a custom element's property after initial
render, re-rendering the Lit template manually is verbose and easy to forget.
[`tests/reactive-render.svelte.ts`](./tests/reactive-render.svelte.ts) solves this with a `render()`
helper that wraps the Lit renderer in a Svelte `$effect.root()`. Any `$state()` variable referenced
inside the template is tracked automatically, and the element re-renders whenever it changes.

```ts
test("setting the value as a property", async () => {
  let value = $state("World");

  // Pass a getter, not a value — $effect tracks reads inside
  const screen = await render(() => html`<svelte-vite .name=${value}></svelte-vite>`);

  await expect.element(screen.getByText("Hello")).toHaveTextContent(value);

  // Mutate the $state variable — the element re-renders automatically
  value = "Friend";

  await expect.element(screen.getByText("Hello")).toHaveTextContent(value);
});
```

This pattern lets tests read and write element properties directly as plain variables, with
reactivity handled transparently by the Svelte runtime.
