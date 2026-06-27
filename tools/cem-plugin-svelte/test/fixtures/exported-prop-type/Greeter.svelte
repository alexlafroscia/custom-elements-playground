<svelte:options
  customElement={{
    tag: "svelte-vite",
  }}
/>

<script lang="ts" module>
  export interface GreeterProps {
    /**
     * The name of the person to greet
     */
    name: string;
  }
</script>

<script lang="ts">
  let { name }: GreeterProps = $props();
</script>

<p>Hello, {name}</p>
