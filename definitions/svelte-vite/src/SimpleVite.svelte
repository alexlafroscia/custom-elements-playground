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

  /**
   * Return a value from inside of the component
   */
  export function getName(): string {
    return name;
  }
</script>

<p>Hello, {name}</p>
