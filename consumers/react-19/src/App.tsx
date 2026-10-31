import { useRef, useState } from "react";

export function App() {
  const [name, setName] = useState("World");

  // `HTMLSimpleViteElement` is declared globally by the library's types
  const element = useRef<HTMLSimpleViteElement>(null);
  const [nameFromElement, setNameFromElement] = useState<string>();
  const [greeted, setGreeted] = useState<string[]>([]);

  return (
    <>
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>

      {/*
        `name` is type-checked against the `name` property of
        `HTMLSimpleViteElement`; `tsc` reports a value that isn't a string, or
        a prop the element doesn't define. React 19 listens for the event named
        by the rest of an `on` prop, verbatim, so `ongreet` handles the
        element's `greet` event, which is a `CustomEvent<string>`
      */}
      <svelte-vite
        name={name}
        ref={element}
        ongreet={(event) => setGreeted((greeted) => [...greeted, event.detail])}
      ></svelte-vite>

      <p>Greeted: {greeted.join(", ")}</p>

      <button onClick={() => setNameFromElement(element.current?.getName())}>Call getName()</button>
      <output>{nameFromElement}</output>

      <mutable-state expose="Click to change"></mutable-state>
    </>
  );
}
