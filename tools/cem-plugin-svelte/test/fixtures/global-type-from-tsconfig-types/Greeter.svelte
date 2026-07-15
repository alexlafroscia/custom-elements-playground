<svelte:options
  customElement={{
    tag: "svelte-vite",
  }}
/>

<script lang="ts">
  let { target }: { target: HTMLGreeterTargetElement } = $props();
</script>

<p>Hello, {target.greeting}</p>
