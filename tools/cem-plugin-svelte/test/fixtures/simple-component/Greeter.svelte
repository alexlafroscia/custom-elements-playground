<svelte:options
  customElement={{
    tag: "svelte-vite",
  }}
/>

<script lang="ts">
  interface Props {
    /**
     * The name of the person to greet
     */
    name: string;
  }

  let { name }: Props = $props();
</script>

<p>Hello, {name}</p>
