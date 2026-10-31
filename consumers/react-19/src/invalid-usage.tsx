// Usages of the library's custom elements that the types must reject. This
// module is never rendered; `tsc` fails if any of these become valid

export const invalidUsage = (
  <>
    {/* @ts-expect-error -- `name` must be a string */}
    <svelte-vite name={1}></svelte-vite>

    {/* @ts-expect-error -- `svelte-vite` has no `expose` property */}
    <svelte-vite expose="nope"></svelte-vite>

    {/* @ts-expect-error -- `greet` events carry a `string` as their `detail` */}
    <svelte-vite ongreet={(event: CustomEvent<number>) => event}></svelte-vite>

    {/* @ts-expect-error -- React would listen for a `Greet` event, which is never dispatched */}
    <svelte-vite onGreet={() => {}}></svelte-vite>

    {/* @ts-expect-error -- `ref` must hold the element's type */}
    <svelte-vite ref={{ current: document.createElement("input") }}></svelte-vite>

    {/* @ts-expect-error -- `not-an-element` is not a defined custom element */}
    <not-an-element></not-an-element>
  </>
);
