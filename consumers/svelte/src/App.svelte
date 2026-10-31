<script lang="ts">
  // Registers the custom elements defined by the library
  import "@cem-playground/svelte-vite";

  let name = $state("World");

  // `HTMLSimpleViteElement` is declared globally by the library's types
  let element: HTMLSimpleViteElement | undefined = $state();
  let nameFromElement: string | undefined = $state();
</script>

<label>
  Name
  <input bind:value={name} />
</label>

<!--
  `name` is type-checked against the `name` property of `HTMLSimpleViteElement`;
  `svelte-check` reports a value that isn't a string, or a prop the element
  doesn't define
-->
<svelte-vite {name} bind:this={element}></svelte-vite>

<button onclick={() => (nameFromElement = element?.getName())}>Call getName()</button>
<output>{nameFromElement}</output>

<mutable-state expose="Click to change"></mutable-state>
