<svelte:options
  customElement={{
    tag: "mutable-state",
  }}
/>

<script lang="ts" module>
  export const INTERNAL_VALUE = "Internal Value";
</script>

<script lang="ts">
  interface Props {
    expose: string;
  }

  let { expose }: Props = $props();

  function handleClick() {
    expose = INTERNAL_VALUE;
  }
</script>

<button onclick={handleClick}>{expose}</button>
