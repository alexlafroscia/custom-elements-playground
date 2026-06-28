<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    name: string;
  }

  let { name }: Props = $props();

  onMount(() => {
    debugger;
  });
</script>

<p>Ciao, {name}</p>
