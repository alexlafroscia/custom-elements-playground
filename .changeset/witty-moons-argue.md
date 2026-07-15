---
"cem-plugin-svelte": patch
---

Preserve `undefined` in prop and method types. The type-resolution program now enables
`strictNullChecks` by default (a tsconfig that explicitly disables it still wins), so types like
`HTMLElement | undefined` are no longer reported as `HTMLElement` in the manifest and generated
`.d.ts` files.
