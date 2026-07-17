# cem-plugin-dts

## 1.1.0

### Minor Changes

- 1289295: Emit `import type` statements for types referenced from other packages and from local
  modules. Local module paths from the manifest are used verbatim, relativized to the emitted file's
  location.
- bdf29f5: Export the generated `HTMLElement` interfaces from the emitted file in addition to
  declaring them globally, so they can be imported explicitly with `import type`.

## 1.0.0

### Major Changes

- 64c1ef8: Initial package release
