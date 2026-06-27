<svelte:options
  customElement={{
    tag: "svelte-vite",
  }}
/>

<script lang="ts">
  import type { Props } from "./types.js";

  let { name }: Props = $props();
</script>

<p>Hello, {name}</p>
