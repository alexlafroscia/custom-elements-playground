<!--
  @component

  A component with documentation.

  @slot - Default slot content
  @slot icon - An icon to display

  @csspart container - The outer container element

  @prop {string} name - The name prop description
  @prop {string} extra-prop - An extra property not from $props

  @attr {string} name - The name attribute description from comment
  @attr {string} data-theme - Theme for the component
-->
<svelte:options
  customElement={{
    tag: "with-component-doc",
  }}
/>

<script lang="ts">
  interface Props {
    name: string;
  }

  let { name }: Props = $props();
</script>

<p>{name}</p>
