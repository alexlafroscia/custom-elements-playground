<svelte:options
  customElement={{
    tag: "element-with-method",
  }}
/>

<script lang="ts">
  /**
   * Toggle the "open" state of the component
   */
  export function open(current: boolean): boolean {
    return false;
  }
</script>
