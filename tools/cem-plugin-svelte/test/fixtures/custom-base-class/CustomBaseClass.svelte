<svelte:options
  customElement={{
    tag: "svelte-vite",
    extend(svelteCustomElementClass) {
      return class extends svelteCustomElementClass {
        /**
         * This is an extra property on the custom base class
         */
        someProperty!: string;

        /**
         * This is an extra method on the custom base class
         */
        extraMethod() {}
      };
    },
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
