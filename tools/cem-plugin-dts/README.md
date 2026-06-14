# `cem-plugin-dts`

A plugin for [`@custom-elements-manifest/analyzer`](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
that generates TypeScript type definitions from a `custom-elements.json` manifest.

For each custom element in the manifest it produces an `HTMLXxxElement` interface and merges it
into TypeScript's built-in `HTMLElementTagNameMap`, so that
`document.querySelector("my-element")` returns the correct type without any manual declarations.

## Usage

```js
import { dts } from "cem-plugin-dts";

export default {
  globs: ["./src/**/*.js"],
  plugins: [dts({ path: "./register-types/html-element.d.ts" })],
};
```

## Options

```ts
dts({
  // Path to write the generated .d.ts file to. Required.
  path: string,

  // Directory to resolve `path` relative to. Defaults to process.cwd().
  cwd: string,
});
```

## Output

Given a manifest documenting a `<svelte-vite-custom>` element with a `name` property and a
`getName()` method, the plugin writes:

```ts
declare interface HTMLSimpleViteElement extends HTMLElement {
  /** The name of the person to greet */
  name: string;
  /** Return a value from inside of the component */
  getName(): string;
}

declare interface HTMLElementTagNameMap {
  "svelte-vite-custom": HTMLSimpleViteElement;
}
```

Multiple elements in the same manifest are all merged into a single `HTMLElementTagNameMap`
declaration in one file.
