# `cem-plugin-dts`

A plugin for
[`@custom-elements-manifest/analyzer`](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
that generates TypeScript type definitions from a `custom-elements.json` manifest.

For each custom element in the manifest it produces an `HTMLXxxElement` interface and merges it into
TypeScript's built-in `HTMLElementTagNameMap`, so that `document.querySelector("my-element")`
returns the correct type without any manual declarations.

## Usage

```js
import { dts } from "cem-plugin-dts";

export default {
  globs: ["./src/**/*.js"],
  plugins: [dts({ path: "./src/component.d.ts" })],
};
```

## Options

```ts
dts({
  // Path to write the generated .ts file to. Required.
  path: string,

  // Directory to resolve `path` relative to. Defaults to process.cwd().
  cwd: string,

  // Additionally emit types for using the elements in Svelte markup. Optional.
  svelte: {
    // Path to write the generated .d.ts file to, resolved relative to `cwd`.
    path: string,
  },
});
```

## Output

Given a manifest documenting a `simple-greeter` element with a `name` property and a `getGreeting()`
method, the plugin writes:

```ts
export {};

declare global {
  interface HTMLSimpleGreeterElement extends HTMLElement {
    /** The name of the person to greet */
    name: string;
    /** Return a greeting message */
    getGreeting(): string;
  }

  interface HTMLElementTagNameMap {
    "simple-greeter": HTMLSimpleGreeterElement;
  }
}
```

Note that the `.d.ts` file is designed to be emitted into your `src` directory, where it will be
imported by another source file to included in your library's output:

```typescript
// src/index.ts
import "./components.d.ts;
```

Multiple elements in the same manifest are all merged into a single `HTMLElementTagNameMap`
declaration in one file.

## Svelte Output

When the `svelte` option is provided, the plugin also writes a module augmentation of
`svelte/elements` so that `svelte-check` validates usage of each element in Svelte markup:

```ts
import type { HTMLAttributes } from "svelte/elements";

import type { HTMLSimpleGreeterElement } from "./types.ts";

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "simple-greeter": HTMLAttributes<HTMLSimpleGreeterElement> &
      Partial<Pick<HTMLSimpleGreeterElement, "name">>;
  }
}
```

Svelte sets a prop on a custom element as a property when the element has one by that name, so each
element accepts its public, writable fields, typed by its generated `HTMLElement` interface. Fields
are optional, since a custom element can't require that a property be set.

Emit this file with a `.d.ts` extension so that consumers can opt into it with
`/// <reference types="..." />`, without needing `svelte` installed unless they use it.

## Project Setup Considerations

If you choose to configure version control to ignore the emitted file, ensure that CEM Analyzer runs
before your library is compiled so that the imported file is created before it is imported. You may
also choose to check the file into version control, which can help visualize changes to your publish
interfaces over time.
