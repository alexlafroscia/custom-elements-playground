---
"cem-plugin-svelte": minor
---

Honor `tsconfig.json` when resolving prop types, so globally-declared types (for example, from
`types`/`typeRoots`) can be resolved. A new `tsconfigPath` option controls which config file is
used, falling back to `<cwd>/tsconfig.json`. Globally-available types are now labeled with the
manifest schema's `global:` package convention in type references.
