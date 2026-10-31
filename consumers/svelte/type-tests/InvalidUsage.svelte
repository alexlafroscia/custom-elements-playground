<!--
  Usages of the library's custom elements that `svelte-check` must reject.

  Each `@expect-error` comment names an error that must be reported for the
  element that follows it; `tests/type-check.test.ts` verifies that these are
  exactly the errors reported for this file.
-->

<!-- Allows TypeScript in markup expressions -->
<script lang="ts"></script>

<!-- @expect-error Type 'number' is not assignable to type 'string'. -->
<svelte-vite name={42}></svelte-vite>

<!-- @expect-error '"nmae"' does not exist in type -->
<svelte-vite nmae="World"></svelte-vite>

<!-- @expect-error Type 'boolean' is not assignable to type 'string'. -->
<mutable-state expose={true}></mutable-state>

<!-- Methods are not props -->
<!-- @expect-error '"getName"' does not exist in type -->
<svelte-vite getName={() => "World"}></svelte-vite>

<!-- Event handlers must accept the event the element dispatches -->
<!-- @expect-error Type 'string' is not assignable to type 'number'. -->
<svelte-vite ongreet={(event: CustomEvent<number>) => event.detail.toFixed()}></svelte-vite>

<!-- Svelte matches event names case-sensitively, so `onGreet` would never be called -->
<!-- @expect-error '"onGreet"' does not exist in type -->
<svelte-vite onGreet={() => {}}></svelte-vite>

<!-- Elements accept no handlers for events they don't document -->
<!-- @expect-error '"ongreet"' does not exist in type -->
<mutable-state ongreet={() => {}}></mutable-state>
