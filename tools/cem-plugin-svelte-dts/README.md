# `cem-plugin-svelte-dts`

A plugin for
[`@custom-elements-manifest/analyzer`](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
that generates types for using custom elements in [Svelte](https://svelte.dev/) markup.

Out of the box, Svelte types any element it doesn't know about as accepting any attribute with a
value of any type. For each custom element in the manifest, this plugin
[augments `svelte/elements`](https://svelte.dev/docs/svelte/typescript#Enhancing-built-in-DOM-types)
so that `svelte-check` validates the props passed to the element.

## Usage

```js
import { svelteDts } from "cem-plugin-svelte-dts";

export default {
  globs: ["./src/**/*.js"],
  plugins: [svelteDts({ path: "./types/svelte-elements.d.ts" })],
};
```

Consumers opt into the generated types by referencing them, for example from a `.d.ts` file in their
Svelte app:

```ts
/// <reference types="my-library/svelte-elements" />
```

Type references only resolve declaration files, so give `path` a `.d.ts` extension.

## Options

```ts
svelteDts({
  // Path to write the generated .d.ts file to. Required.
  path: string,

  // Directory to resolve `path` relative to. Defaults to process.cwd().
  cwd: string,

  // Module specifiers to import alongside the generated types, such as a file
  // that registers the elements in `HTMLElementTagNameMap`. Optional.
  imports: string[],
});
```

## Output

Given a manifest documenting a `simple-greeter` element with a `name` property, the plugin writes:

```ts
import type {} from "svelte/elements";

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "simple-greeter": HTMLAttributes<HTMLElementTagNameMap["simple-greeter"]> &
      Partial<Pick<HTMLElementTagNameMap["simple-greeter"], "name">>;
  }
}
```

Each element accepts:

- The attributes and event handlers Svelte accepts on every HTML element, such as `class`, `aria-*`,
  and `onclick`, with handlers typed against the element
- Its props: Svelte sets a prop on a custom element as a property when the element has one by that
  name, so each public, writable instance field documented in the manifest is accepted. Static,
  readonly, private, and protected fields, and methods, are not. Props are optional, as a custom
  element can't require that a property be set.

## Element types

The type of each prop is read from the element's entry in `HTMLElementTagNameMap`, rather than from
the type text in the manifest, so the generated types stay in sync with the element's own types and
need no imports of their own. The elements must therefore be registered in `HTMLElementTagNameMap`,
which is conventional for custom element libraries and is what
[`cem-plugin-dts`](../cem-plugin-dts/README.md) generates.

If consumers might reference the Svelte types without otherwise loading that registration, use the
`imports` option to import it from the generated file:

```js
svelteDts({
  path: "./types/svelte-elements.d.ts",
  imports: ["./html-element.ts"],
});
```

Specifiers are emitted as-is, so relative paths are resolved from the generated file.

If the registration is missing from a consumer's program, the generated file has type errors. With
`skipLibCheck` enabled, as [`@tsconfig/svelte`](https://www.npmjs.com/package/@tsconfig/svelte)
does, those errors aren't reported, and the element's props are silently typed as `any`. Prefer the
`imports` option whenever the registration lives in a file of its own.
