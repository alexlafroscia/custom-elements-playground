<svelte:options
  customElement={{
    tag: "svelte-vite",
  }}
/>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { PersonOptions } from "./types.js";

  let { greet }: { greet: Snippet<[PersonOptions]> } = $props();
</script>

{@render greet({ firstName: "World", lastName: "!" })}
