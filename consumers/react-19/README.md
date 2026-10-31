# `@cem-playground/react-19-consumer`

A React 19 app demonstrating how a consumer uses the custom elements defined by
[`@cem-playground/svelte-vite`](../../definitions/svelte-vite/README.md) directly in JSX, without
wrapper components, with every usage of those elements validated by `tsc`.

## How React 19 handles custom elements

React 19 treats any tag containing a hyphen as a custom element:

- For each prop, React checks whether the element has a property of that name (`name in element`).
  If it does, the prop is set as a property, so values of any type arrive unchanged; otherwise it is
  set as an attribute.
- A prop starting with `on` whose value is a function adds an event listener for the event named by
  the rest of the prop, verbatim and case-sensitively, so `ongreet` listens for `greet`. React's own
  event props, like `onClick`, are still handled by React's event system.

Because the property check happens against the live element, the elements must be defined before
React renders them. [`src/main.tsx`](./src/main.tsx) imports the library's entry point, which
defines them, before rendering:

```tsx
import "@cem-playground/svelte-vite";
import { createRoot } from "react-dom/client";
```

## Type-checking usage in JSX

TypeScript rejects a JSX tag it doesn't find in `JSX.IntrinsicElements`. The library ships types for
its elements in React from the `@cem-playground/svelte-vite/react` export, which are opted into with
a type reference in [`src/custom-elements.d.ts`](./src/custom-elements.d.ts):

```ts
/// <reference types="@cem-playground/svelte-vite/react" />
```

With the reference in place, each element accepts the props React allows on every HTML element, with
`ref` typed as the element, along with its own properties and handlers for the events it documents:

```tsx
const element = useRef<HTMLSimpleViteElement>(null);

<svelte-vite
  name={name}
  ref={element}
  ongreet={(event) => setGreeted((greeted) => [...greeted, event.detail])}
></svelte-vite>;
```

[`src/invalid-usage.tsx`](./src/invalid-usage.tsx) holds usages the types must reject, each marked
with `@ts-expect-error`, so `tsc` fails if any of them become valid:

```tsx
<>
  {/* @ts-expect-error -- `name` must be a string */}
  <svelte-vite name={1}></svelte-vite>

  {/* @ts-expect-error -- React would listen for a `Greet` event, which is never dispatched */}
  <svelte-vite onGreet={() => {}}></svelte-vite>
</>
```

## Tasks

| Task             | Description                  |
| ---------------- | ---------------------------- |
| `mise run dev`   | Start the development server |
| `mise run build` | Build the app                |
| `mise run check` | Run all tsc type checks      |
| `mise run test`  | Run all checks               |
