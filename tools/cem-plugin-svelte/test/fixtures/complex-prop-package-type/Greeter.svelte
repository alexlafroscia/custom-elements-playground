<svelte:options
  customElement={{
    tag: "svelte-vite",
  }}
/>

<script lang="ts">
  import type { Greeting, PersonOptions } from "greeting-types";
  import type { GreetingStyle } from "greeting-types/style";

  let {
    person,
    style,
    greeting,
  }: {
    person: PersonOptions;
    style: GreetingStyle | undefined;
    greeting: Greeting;
  } = $props();

  /**
   * Get the person currently being greeted
   */
  export function currentPerson(): PersonOptions | undefined {
    return person;
  }
</script>

<p>{greeting}, {person.firstName} {person.lastName}{style?.punctuation}</p>
