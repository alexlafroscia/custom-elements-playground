<svelte:options
  customElement={{
    tag: "svelte-vite",
  }}
/>

<script lang="ts">
  import type { PersonOptions } from "./types.js";

  let { person }: { person: PersonOptions } = $props();

  /**
   * Get the person currently being greeted
   */
  export function currentPerson(): PersonOptions | undefined {
    return person;
  }
</script>

<p>Hello, {person.firstName} {person.lastName}</p>
