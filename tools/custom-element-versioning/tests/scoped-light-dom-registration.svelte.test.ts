import { html, unsafeStatic } from "lit/static-html.js";
import { test, expect } from "vitest";

import { defineUniqueElement } from "../src/define-unique-element";
import GreeterEnglish from "./fixtures/GreeterEnglish.svelte";
import GreeterItalian from "./fixtures/GreeterItalian.svelte";
import { initializeRegistry as initialize } from "./helpers/lit-refs";
import { render } from "./helpers/reactive-render.svelte";

// Note: this test demonstrates specifically that associating a `CustomElementRegistry`
// with a normally-produced light DOM node does NOT work; alternate version of the
// custom element is NOT rendered
test.fails("scoping a registration to a sub-tree", async () => {
  const name = defineUniqueElement(GreeterEnglish.element as unknown as CustomElementConstructor);
  const tagName = unsafeStatic(name);

  const registry = new CustomElementRegistry();
  registry.define(name, GreeterItalian.element as unknown as CustomElementConstructor);

  // oxfmt-ignore
  const result = await render(() => html`
    <${tagName} .name=${"world"}>
    </${tagName}>

    <div ${initialize(registry)}>
      <${tagName} .name=${"world"}>
      </${tagName}>
    </div>
  `);

  await expect.element(result.getByText("Hello, world"), { timeout: 10 }).toBeInTheDocument();
  await expect.element(result.getByText("Ciao, world"), { timeout: 10 }).toBeInTheDocument();
});
