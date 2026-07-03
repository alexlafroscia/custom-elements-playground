# Custom Element Type-Checking Playground

A monorepo for exploring how to author, document, and type-check custom elements — with a particular
focus on getting full TypeScript coverage across the boundary between a custom element library and
the code that consumes it.

## Structure

### `tools/`

Reusable plugins for
[`@custom-elements-manifest/analyzer`](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/)
that extend the CEM toolchain:

| Package                                                    | Description                                                           |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| [`cem-plugin-svelte`](./tools/cem-plugin-svelte/README.md) | Teaches the CEM analyzer to extract metadata from Svelte 5 components |
| [`cem-plugin-dts`](./tools/cem-plugin-dts/README.md)       | Generates TypeScript type definitions from a CEM manifest             |

### `definitions/`

Example component libraries that demonstrate the full workflow end-to-end:

| Package                                              | Description                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`svelte-vite`](./definitions/svelte-vite/README.md) | Svelte 5 custom elements with CEM manifest generation, type definition output, and Vitest Browser tests |
