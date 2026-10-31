<!--
  Usages of the library's custom elements that `svelte-check` must reject.

  Each `@expect-error` comment names an error that must be reported for the
  element that follows it; `tests/type-check.test.ts` verifies that these are
  exactly the errors reported for this file.
-->

<!-- @expect-error Type 'number' is not assignable to type 'string'. -->
<svelte-vite name={42}></svelte-vite>

<!-- @expect-error '"nmae"' does not exist in type -->
<svelte-vite nmae="World"></svelte-vite>

<!-- @expect-error Type 'boolean' is not assignable to type 'string'. -->
<mutable-state expose={true}></mutable-state>

<!-- Methods are not props -->
<!-- @expect-error '"getName"' does not exist in type -->
<svelte-vite getName={() => "World"}></svelte-vite>
