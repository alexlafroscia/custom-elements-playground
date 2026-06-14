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

For each Svelte component configured as a custom element via `<svelte:options customElement>`,
the plugin generates a CEM class declaration with:

- **Fields** — one entry per prop, with name, type, and JSDoc description
- **Attributes** — mirrors the fields list (custom elements expose props as attributes)
- **Methods** — one entry per exported function, with parameter types and return type

```json
{
  "kind": "class",
  "customElement": true,
  "name": "SimpleVite",
  "tagName": "svelte-vite-custom",
  "members": [
    {
      "kind": "field",
      "name": "name",
      "type": { "text": "string" },
      "description": "The name of the person to greet"
    },
    {
      "kind": "method",
      "name": "getName",
      "return": { "type": { "text": "string" } }
    }
  ]
}
```
