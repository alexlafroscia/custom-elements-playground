<script lang="ts">
  interface Props {
    name: string;
  }

  let { name }: Props = $props();
</script>

<p>Hello, {name}</p>
