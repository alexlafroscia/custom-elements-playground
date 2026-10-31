<!--
  @component

  @fires {CustomEvent<string>} greet - Dispatched with the name being greeted when the greet button is clicked
-->
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

  function greet() {
    $host().dispatchEvent(new CustomEvent("greet", { detail: name }));
  }
</script>

<p>Hello, {name}</p>
<button onclick={greet}>Greet</button>
