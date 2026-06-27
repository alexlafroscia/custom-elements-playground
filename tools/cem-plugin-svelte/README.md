# `cem-plugin-svelte`

A plugin for [`@custom-elements-manifest/analyzer`](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
that teaches it how to extract custom element metadata from Svelte 5 components.

The analyzer understands JavaScript and TypeScript out of the box, but not Svelte. This plugin
uses [`svelte2tsx`](https://github.com/sveltejs/language-tools/tree/master/packages/svelte2tsx)
to compile each `.svelte` file to TSX, then uses the TypeScript compiler to resolve prop types
and extract exported methods — including types imported from other files.

## Usage

```js
import { createSveltePlugin } from "cem-plugin-svelte";
import svelteConfig from "./svelte.config.js";

const { plugin, overrideModuleCreation } = createSveltePlugin({
  compilerOptions: svelteConfig.compilerOptions,
});

export default {
  globs: ["./src/**/*.svelte"],
  plugins: [plugin],
  overrideModuleCreation,
};
```

Both `plugin` and `overrideModuleCreation` must be passed to the config. `overrideModuleCreation`
hooks into the analyzer's module creation to provide virtual `.svelte.tsx` files and a shared
TypeScript program for cross-file type resolution.

## Options

```ts
createSveltePlugin({
  // Directory to resolve file paths relative to. Defaults to process.cwd().
  cwd: string,

  // Svelte compiler options; used to ensure components are compiled with the correct options
  compilerOptions: SupportedCompilerOptions,
});
```

## Output

For each Svelte component configured as a custom element via `<svelte:options customElement>`, the plugin generates a CEM `CustomElementDeclaration`.

JSDoc Annotations are expected to be found in the primary comment ([annotated with `@component`](https://svelte.dev/docs/svelte/faq#How-do-I-document-my-components)) containing your component's documentation.

| CEM feature            | Native                                   | JSDoc Annotation                   |
| ---------------------- | ---------------------------------------- | ---------------------------------- |
| Tag name               | `<svelte:options customElement>`         |                                    |
| Description            |                                          | Free text in `@component` comment  |
| Summary                |                                          | `@summary`                         |
| Deprecated             |                                          | `@deprecated`                      |
| Fields                 | Auto-extracted from `$props()`           | `@prop` / `@property` to override  |
| Field types            | Resolved via TypeScript                  |                                    |
| Field descriptions     | From JSDoc on the prop                   |                                    |
| Field default values   |                                          |                                    |
| Attributes             | Auto-generated for primitive-typed props | `@attr` / `@attribute` to override |
| Methods                | Exported functions in `<script>`         |                                    |
| Method parameter types | Resolved via TypeScript                  |                                    |
| Method return types    | Resolved via TypeScript                  |                                    |
| Events                 |                                          | `@event` / `@fires`                |
| Slots                  |                                          | `@slot`                            |
| CSS parts              |                                          | `@csspart` / `@part`               |
| CSS custom properties  |                                          | `@cssprop` / `@cssproperty`        |
| CSS states             |                                          | `@cssstate`                        |
| Mixins                 |                                          |                                    |

### Additional behaviors

- Types are resolved through the TypeScript compiler,following imports across files and packages. JSDoc on the prop type definition is used as the description.
- Fields and methods defined in the inline class passed to `customElement.extend` are included in the declaration.
