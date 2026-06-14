# `@cem-playground/svelte-vite-custom`

A playground package demonstrating how to generate Custom Elements Manifests and TypeScript
type definitions from Svelte custom elements, and how to test them with Vitest Browser.

## Custom Elements Manifest generation

[`@custom-elements-manifest/analyzer`](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
analyzes JavaScript and TypeScript source to produce a `custom-elements.json` manifest describing
a library's custom elements. Out of the box it doesn't understand Svelte, so
[`cem-plugin-svelte`](../../tools/cem-plugin-svelte/) teaches the analyzer how to extract
component metadata from `.svelte` files.

The config in [`custom-elements-manifest.config.js`](./custom-elements-manifest.config.js) shows
the full setup:

```js
import { dts } from "cem-plugin-dts";
import { createSveltePlugin } from "cem-plugin-svelte";

import svelteConfig from "./svelte.config.js";

const { plugin: svelte, overrideModuleCreation } = createSveltePlugin({
  compilerOptions: svelteConfig.compilerOptions,
});

export default {
  globs: ["./src/**/*.svelte"],
  plugins: [svelte, dts({ path: "./register-types/html-element.d.ts" })],
  overrideModuleCreation,
};
```

Running `@custom-elements-manifest/analyzer` with this config produces
[`custom-elements.json`](./custom-elements.json), which documents every custom element in the
package — its tag name, properties, methods, and JSDoc descriptions.

## HTML Element type definition generation

[`cem-plugin-dts`](../../tools/cem-plugin-dts/) is a second CEM plugin (see config above) that
reads the generated manifest and writes a `.d.ts` file. It produces interface declarations for
each element and merges them into TypeScript's built-in `HTMLElementTagNameMap`, so that
`document.querySelector("svelte-vite-custom")` returns the correct type without any manual
declarations.

The output at [`register-types/html-element.d.ts`](./register-types/html-element.d.ts):

```ts
declare interface HTMLSimpleViteElement extends HTMLElement {
  /** The name of the person to greet */
  name: string;
  /** Return a value from inside of the component */
  getName(): string;
}

declare interface HTMLElementTagNameMap {
  "svelte-vite-custom": HTMLSimpleViteElement;
  "mutable-state": HTMLMutableInternalStateElement;
}
```

### Consuming the type definitions

The generated `.d.ts` is wired up in two places:

- **Internally** — `tsconfig.svelte.json` lists it under `compilerOptions.types` so that source
  files within this package see the `HTMLElementTagNameMap` augmentation automatically:
  ```json
  { "types": ["svelte", "vite/client", "./register-types/html-element.d.ts"] }
  ```
- **Externally** — `package.json` surfaces it as the `types` entry for the package export, so
  any package that imports `@cem-playground/svelte-vite-custom` receives the same type
  augmentation:
  ```json
  {
    "exports": {
      ".": { "import": "./dist/index.js", "types": "./register-types/html-element.d.ts" }
    }
  }
  ```

## Browser testing with mutable properties

The tests run in a real browser via [Vitest Browser](https://vitest.dev/guide/browser/) +
[Playwright](https://playwright.dev/), and render elements using
[`vitest-browser-lit`](https://github.com/nickvdyck/vitest-browser-lit) Lit templates.

The interesting DX challenge: when a test needs to update a custom element's property after
initial render, re-rendering the Lit template manually is verbose and easy to forget.
[`tests/reactive-render.svelte.ts`](./tests/reactive-render.svelte.ts) solves this with a
`render()` helper that wraps the Lit renderer in a Svelte `$effect.root()`. Any `$state()`
variable referenced inside the template is tracked automatically, and the element re-renders
whenever it changes.

```ts
test("setting the value as a property", async () => {
  let value = $state("World");

  // Pass a getter, not a value — $effect tracks reads inside
  const screen = await render(() => html`<svelte-vite-custom .name=${value}></svelte-vite-custom>`);

  await expect.element(screen.getByText("Hello")).toHaveTextContent(value);

  // Mutate the $state variable — the element re-renders automatically
  value = "Friend";

  await expect.element(screen.getByText("Hello")).toHaveTextContent(value);
});
```

This pattern lets tests read and write element properties directly as plain variables, with
reactivity handled transparently by the Svelte runtime.
