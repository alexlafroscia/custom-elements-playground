<script lang="ts">
  interface Props {
    name: string;
  }

  let { name }: Props = $props();

  export function myMethod() {}
</script>

<p>Hello, {name}</p>
