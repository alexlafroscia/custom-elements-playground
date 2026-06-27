<svelte:options
  customElement={{
    tag: "svelte-vite",
  }}
/>

<script lang="ts">
  import type { PersonOptions } from "./types.js";

  let { person }: { person: PersonOptions } = $props();
</script>

<p>Hello, {person.firstName} {person.lastName}</p>
