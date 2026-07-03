import { html, unsafeStatic } from "lit/static-html.js";
import { test, expect } from "vitest";

import { defineUniqueElement } from "../src/define-unique-element";
import { makeElementDelegate } from "../src/make-delegate";
import Greeter from "./fixtures/GreeterEnglish.svelte";
import { render } from "./helpers/reactive-render.svelte";

test("wrapping a `CustomElement` constructor", async () => {
  const wrapped = makeElementDelegate(Greeter.element as unknown as CustomElementConstructor);

  const name = defineUniqueElement(wrapped);
  const tagName = unsafeStatic(name);

  // oxfmt-ignore
  const result = await render(() => html`
    <${tagName} .name=${"world"} data-testid="element">
    </${tagName}>
  `);

  const outer = result.getByTestId("element").element();

  debugger;

  await expect
    .element(result.getByText("Hello, world"), {
      message: "Custom element rendering works the same",
      timeout: 10,
    })
    .toBeInTheDocument();
});
