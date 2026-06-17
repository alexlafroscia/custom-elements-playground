<svelte:options
  customElement={{
    tag: "svelte-vite-custom",
  }}
/>

<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

{@render children()}
