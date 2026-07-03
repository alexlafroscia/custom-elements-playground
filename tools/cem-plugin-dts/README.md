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
});
```

## Output

Given a manifest documenting a `simple-greeter` element with a `name` property and a
`getGreeting()` method, the plugin writes:

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

The emitted file is a module (`export {}`) so it can be explicitly imported library's entry point:

```typescript
// src/index.ts
import "./components.d.ts;
```

When a consumer imports your library library, TypeScript will follow the import chain and picks up the
`HTMLElementTagNameMap` augmentations automatically — no extra configuration required.

Multiple elements in the same manifest are all merged into a single `HTMLElementTagNameMap` declaration in
one file.

## Project Setup Considerations

If you choose to configure version control to ignore the emitted file, ensure that CEM Analyzer runs
before your library is compiled so that the imported file is created before it is imported. You may
also choose to check the file into version control, which can help visualize changes to your publish
interfaces over time.
