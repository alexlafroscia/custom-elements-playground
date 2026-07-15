<svelte:options
  customElement={{
    tag: "svelte-vite",
  }}
/>

<script lang="ts">
  let { label }: { label: string | undefined } = $props();

  /**
   * Find the currently-highlighted element
   */
  export function highlighted(): HTMLElement | undefined {
    return undefined;
  }
</script>

<p>{label}</p>
