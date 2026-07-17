# cem-plugin-svelte

## 1.2.0

### Minor Changes

- 1289295: Reference types imported from other packages by the module specifier they are importable
  from, including types used in unions, type aliases, and method signatures.

## 1.1.0

### Minor Changes

- 2b4daa7: Honor `tsconfig.json` when resolving prop types, so globally-declared types (for example,
  from `types`/`typeRoots`) can be resolved. A new `tsconfigPath` option controls which config file
  is used, falling back to `<cwd>/tsconfig.json`. Globally-available types are now labeled with the
  manifest schema's `global:` package convention in type references.

### Patch Changes

- 65b9637: Preserve `undefined` in prop and method types. The type-resolution program now enables
  `strictNullChecks` by default (a tsconfig that explicitly disables it still wins), so types like
  `HTMLElement | undefined` are no longer reported as `HTMLElement` in the manifest and generated
  `.d.ts` files.

## 1.0.1

### Patch Changes

- 73384d6: Add `svelte2tsx` as a dependency
- 786cf62: Normalize kebab-case file names

## 1.0.0

### Major Changes

- 64c1ef8: Initial package release
